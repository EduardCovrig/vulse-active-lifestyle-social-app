package com.vulse.api.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vulse.api.backend.dtos.post.PostAuthorDto;
import com.vulse.api.backend.dtos.post.PostResponse;
import com.vulse.api.backend.dtos.post.FeedResponse;
import com.vulse.api.backend.dtos.user.UserSuggestionResponse;
import com.vulse.api.backend.models.*;
import com.vulse.api.backend.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final Cloudinary cloudinary;
    private final CommentRepository commentRepository;
    private final LikeRepository likeRepository;
    private final ReactionRepository reactionRepository;
    private final SavedMealRepository savedMealRepository; // Needed for cleanup
    private final ReportRepository reportRepository;
    private final BlockRepository blockRepository;
    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    /**
     * Creates a new post with optional dual-camera (DAILY) or AI analysis (MEAL).
     */
    @Transactional
    public PostResponse createPost(User user, MultipartFile file, MultipartFile frontFile,
                                   String caption, PostType type, Integer calories,
                                   Integer proteinGrams, Integer carbsGrams, Integer fatGrams) throws IOException {

        //check
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.startsWith("video/"))) {
            throw new IllegalArgumentException("Only images and videos are allowed!");
        }
        if (type == PostType.DAILY && frontFile != null) {
            String frontType = frontFile.getContentType();
            if (frontType == null || !frontType.startsWith("image/")) {
                throw new IllegalArgumentException("Front camera snap must be an image!");
            }
        }

        // 1. Enforce Daily Limit: Only 1 post of type DAILY allowed per 24h
        if (type == PostType.DAILY) {
            LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
            boolean alreadyPosted = postRepository.existsByUserIdAndTypeAndCreatedAtAfter(user.getId(), PostType.DAILY, startOfDay);
            if (alreadyPosted) {
                throw new IllegalStateException("You have already posted your Daily Snap today!");
            }
        }

        // 2. Upload primary media to Cloudinary
        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("resource_type", "auto"));
        String mediaUrl = uploadResult.get("secure_url").toString();
        String mediaPublicId = uploadResult.get("public_id").toString();

        // 3. Keep manual macros if provided
        Integer finalCal = calories, finalPro = proteinGrams, finalCarb = carbsGrams, finalFat = fatGrams;

        // 4. Build the Post entity
        Post post = Post.builder()
                .user(user)
                .mediaUrl(mediaUrl)
                .mediaPublicId(mediaPublicId)
                .caption(caption)
                .type(type)
                .calories(finalCal)
                .proteinGrams(finalPro)
                .carbsGrams(finalCarb)
                .fatGrams(finalFat)
                .build();

        // 5. Handle Front Camera for BeReal-style posts
        if (type == PostType.DAILY && frontFile != null) {
            Map frontResult = cloudinary.uploader().upload(frontFile.getBytes(), ObjectUtils.asMap("resource_type", "auto"));
            post.setFrontMediaUrl(frontResult.get("secure_url").toString());
            post.setFrontMediaPublicId(frontResult.get("public_id").toString());
        }

        Post savedPost = postRepository.save(post);
        return mapToResponse(savedPost, user);
    }

    /**
     * Updates only the caption of an existing post.
     */
    @Transactional
    public PostResponse updateCaption(UUID postId, String newCaption, User user) {
        Post post = getPostById(postId);
        if (!post.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized: You don't own this post.");
        }
        post.setCaption(newCaption);
        return mapToResponse(postRepository.save(post), user);
    }

    /**
     * Deletes a post, all its interactions, and its associated media from Cloudinary.
     * Cloudinary HTTP calls are performed AFTER the DB transaction commits to avoid
     * holding a DB connection during potentially slow external HTTP calls.
     */
    public void deletePost(UUID postId, User user) {
        // Phase 1: DB operations inside a transaction; collect Cloudinary IDs to purge
        List<String> cloudinaryIdsToDelete = deletePostDbWork(postId, user);

        // Phase 2: Cloudinary cleanup OUTSIDE the transaction
        for (String publicId : cloudinaryIdsToDelete) {
            try {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            } catch (IOException e) {
                System.err.println("Warning: Cloudinary asset failed to delete: " + publicId);
            }
        }
    }

    /**
     * Transactional phase of deletePost — does all DB work and returns Cloudinary public IDs to clean up.
     */
    @Transactional
    protected List<String> deletePostDbWork(UUID postId, User user) {
        Post post = getPostById(postId);
        if (!post.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized: You don't own this post.");
        }

        List<String> cloudinaryIds = new ArrayList<>();

        // 1. Collect & delete Reactions
        List<Reaction> postReactions = reactionRepository.findByPostId(postId);
        for (Reaction reaction : postReactions) {
            if (reaction.getMediaPublicId() != null) {
                cloudinaryIds.add(reaction.getMediaPublicId());
            }
        }
        reactionRepository.deleteAll(postReactions);

        // 2. Delete Comments, Likes, Reports
        reportRepository.deleteAll(reportRepository.findByPostId(postId));
        commentRepository.deleteAll(commentRepository.findByPostId(postId));
        likeRepository.deleteAll(likeRepository.findByPostId(postId));

        // 3. Nullify originalPost reference in SavedMeals
        List<SavedMeal> linkedMeals = savedMealRepository.findByOriginalPostId(postId);
        for(SavedMeal meal : linkedMeals) {
            meal.setOriginalPost(null);
            savedMealRepository.save(meal);
        }

        // 4. Collect Post's Cloudinary media IDs
        if (post.getMediaPublicId() != null) {
            cloudinaryIds.add(post.getMediaPublicId());
        }
        if (post.getFrontMediaPublicId() != null) {
            cloudinaryIds.add(post.getFrontMediaPublicId());
        }

        // 5. Delete post
        postRepository.delete(post);

        return cloudinaryIds;
    }

    public FeedResponse getFeedByType(User user, PostType type, Pageable pageable) {
        if (type == PostType.REEL) {
            List<Post> allReels = postRepository.findAllSafeVideosList(user.getId(), PostType.REEL);
            
            long dailySeed = LocalDate.now().hashCode() ^ user.getId().hashCode();
            
            List<Post> sortedReels = allReels.stream()
                    .sorted((p1, p2) -> {
                        double score1 = calculateReelScore(p1, dailySeed);
                        double score2 = calculateReelScore(p2, dailySeed);
                        return Double.compare(score2, score1);
                    })
                    .toList();
            
            int start = (int) pageable.getOffset();
            int end = Math.min((start + pageable.getPageSize()), sortedReels.size());
            
            List<Post> paginatedContent = new ArrayList<>();
            if (start < sortedReels.size()) {
                paginatedContent = sortedReels.subList(start, end);
            }
            
            List<PostResponse> responses = mapToResponseBatch(paginatedContent, user);
            
            int totalPages = (int) Math.ceil((double) sortedReels.size() / pageable.getPageSize());
            boolean last = (pageable.getPageNumber() >= totalPages - 1) || totalPages == 0;
            
            return FeedResponse.builder()
                    .content(responses)
                    .pageNumber(pageable.getPageNumber())
                    .pageSize(pageable.getPageSize())
                    .totalElements(sortedReels.size())
                    .totalPages(totalPages)
                    .last(last)
                    .suggestedFriends(null)
                    .build();
        } else {
            long followingCount = followRepository.countByFollowerId(user.getId());
            long followersCount = followRepository.countByFollowingId(user.getId());
            
            List<UserSuggestionResponse> suggestedFriends = null;
            if (followingCount == 0 && followersCount == 0) {
                suggestedFriends = getSuggestedFriends(user);
            }
            
            Page<Post> postPage = postRepository.findFriendsFeed(user.getId(), type, pageable);
            List<PostResponse> responses = mapToResponseBatch(postPage.getContent(), user);
            
            return FeedResponse.builder()
                    .content(responses)
                    .pageNumber(pageable.getPageNumber())
                    .pageSize(pageable.getPageSize())
                    .totalElements(postPage.getTotalElements())
                    .totalPages(postPage.getTotalPages())
                    .last(postPage.isLast())
                    .suggestedFriends(suggestedFriends)
                    .build();
        }
    }

    private double calculateReelScore(Post post, long dailySeed) {
        double ageInHours = java.time.Duration.between(post.getCreatedAt(), java.time.LocalDateTime.now()).toMinutes() / 60.0;
        double decay = 1.0 / Math.pow(ageInHours + 2.0, 1.8);
        long postSeed = dailySeed ^ post.getId().getMostSignificantBits();
        double randomWeight = 0.5 + new Random(postSeed).nextDouble();
        return decay * randomWeight;
    }

    private List<UserSuggestionResponse> getSuggestedFriends(User currentUser) {
        List<User> allUsers = userRepository.findAll();
        List<UserSuggestionResponse> suggestions = new ArrayList<>();
        for (User u : allUsers) {
            if (suggestions.size() >= 10) break;
            if (!u.getId().equals(currentUser.getId())) {
                suggestions.add(UserSuggestionResponse.builder()
                        .id(u.getId())
                        .username(u.getRealUsername())
                        .profilePicUrl(u.getProfilePicUrl())
                        .mutuals(0L)
                        .build());
            }
        }
        return suggestions;
    }

    /**
     * Fetches posts created by the authenticated user.
     */
    public List<PostResponse> getMyPosts(User user) {
        List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return mapToResponseBatch(posts, user);
    }

    /**
     * Fetch a single post by ID formatted for UI
     */
    public PostResponse getSinglePost(UUID postId, User currentUser) {
        Post post = getPostById(postId);

        // SECURITATE: Check if blocked
        if (blockRepository.existsByBlockerIdAndBlockedId(currentUser.getId(), post.getUser().getId()) ||
                blockRepository.existsByBlockerIdAndBlockedId(post.getUser().getId(), currentUser.getId())) {
            throw new IllegalStateException("Content unavailable.");
        }

        return mapToResponse(post, currentUser);
    }

    private Post getPostById(UUID id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Post not found."));
    }

    /**
     * Maps a single Entity to DTO with all social counts and status flags.
     * Used for single-post endpoints where N+1 is not a concern (N=1).
     */
    private PostResponse mapToResponse(Post post, User currentUser) {
        PostAuthorDto authorDto = PostAuthorDto.builder()
                .id(post.getUser().getId())
                .username(post.getUser().getRealUsername())
                .profilePicUrl(post.getUser().getProfilePicUrl())
                .build();

        boolean isLiked = likeRepository.existsByUserIdAndPostId(currentUser.getId(), post.getId());
        long likesCount = likeRepository.countByPostId(post.getId());
        long commentsCount = commentRepository.countByPostId(post.getId());

        // Get Top 3 reactions (RealMojis) for the UI cluster
        List<String> reactions = reactionRepository.findTop3ByPostIdOrderByCreatedAtDesc(post.getId())
                .stream()
                .map(Reaction::getMediaUrl)
                .toList();

        return PostResponse.builder()
                .id(post.getId())
                .mediaUrl(post.getMediaUrl())
                .frontMediaUrl(post.getFrontMediaUrl())
                .calories(post.getCalories())
                .proteinGrams(post.getProteinGrams())
                .carbsGrams(post.getCarbsGrams())
                .fatGrams(post.getFatGrams())
                .caption(post.getCaption())
                .type(post.getType())
                .createdAt(post.getCreatedAt())
                .author(authorDto)
                .isLiked(isLiked)
                .likesCount(likesCount)
                .commentsCount(commentsCount)
                .recentReactions(reactions)
                .build();
    }

    /**
     * Batch-maps a list of Post entities to DTOs, using only 3 aggregate queries
     * instead of 3×N individual queries (N+1 fix).
     */
    private List<PostResponse> mapToResponseBatch(List<Post> posts, User currentUser) {
        if (posts.isEmpty()) return List.of();

        List<UUID> postIds = posts.stream().map(Post::getId).toList();

        // Batch fetch: like counts per post
        Map<UUID, Long> likeCountMap = likeRepository.countGroupedByPostIds(postIds)
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));

        // Batch fetch: comment counts per post
        Map<UUID, Long> commentCountMap = commentRepository.countGroupedByPostIds(postIds)
                .stream()
                .collect(Collectors.toMap(
                        row -> (UUID) row[0],
                        row -> (Long) row[1]
                ));

        // Batch fetch: which posts the current user has liked
        Set<UUID> likedPostIds = new HashSet<>(likeRepository.findLikedPostIdsByUser(currentUser.getId(), postIds));

        // Build responses using pre-fetched data
        return posts.stream().map(post -> {
            PostAuthorDto authorDto = PostAuthorDto.builder()
                    .id(post.getUser().getId())
                    .username(post.getUser().getRealUsername())
                    .profilePicUrl(post.getUser().getProfilePicUrl())
                    .build();

            // Top 3 reactions still per-post (small N, and reaction media URLs are needed)
            List<String> reactions = reactionRepository.findTop3ByPostIdOrderByCreatedAtDesc(post.getId())
                    .stream()
                    .map(Reaction::getMediaUrl)
                    .toList();

            return PostResponse.builder()
                    .id(post.getId())
                    .mediaUrl(post.getMediaUrl())
                    .frontMediaUrl(post.getFrontMediaUrl())
                    .calories(post.getCalories())
                    .proteinGrams(post.getProteinGrams())
                    .carbsGrams(post.getCarbsGrams())
                    .fatGrams(post.getFatGrams())
                    .caption(post.getCaption())
                    .type(post.getType())
                    .createdAt(post.getCreatedAt())
                    .author(authorDto)
                    .isLiked(likedPostIds.contains(post.getId()))
                    .likesCount(likeCountMap.getOrDefault(post.getId(), 0L))
                    .commentsCount(commentCountMap.getOrDefault(post.getId(), 0L))
                    .recentReactions(reactions)
                    .build();
        }).toList();
    }

    /**
     * Fetches posts by a specific user (for viewing other user profiles).
     */
    public List<PostResponse> getUserPosts(String username, User currentUser) {
        User targetUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found."));

        // Block check
        if (blockRepository.existsByBlockerIdAndBlockedId(currentUser.getId(), targetUser.getId()) ||
                blockRepository.existsByBlockerIdAndBlockedId(targetUser.getId(), currentUser.getId())) {
            throw new IllegalStateException("Content unavailable.");
        }

        List<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(targetUser.getId());
        return mapToResponseBatch(posts, currentUser);
    }
}
package com.vulse.api.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vulse.api.backend.dtos.post.PostAuthorDto;
import com.vulse.api.backend.dtos.post.PostResponse;
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
import java.util.List;
import java.util.Map;
import java.util.UUID;
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
     * Fully GDPR and DB Foreign Key compliant.
     */
    @Transactional
    public void deletePost(UUID postId, User user) {
        Post post = getPostById(postId);
        if (!post.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized: You don't own this post.");
        }

        // 1. Delete Reactions - MULT MAI EFICIENT (Doar query pe DB, nu pe tot tabelul)
        List<Reaction> postReactions = reactionRepository.findByPostId(postId);
        for (Reaction reaction : postReactions) {
            try {
                if (reaction.getMediaPublicId() != null) {
                    cloudinary.uploader().destroy(reaction.getMediaPublicId(), ObjectUtils.emptyMap());
                }
            } catch (IOException e) {
                System.err.println("Warning: Cloudinary asset failed to delete for reaction: " + reaction.getId());
            }
            reactionRepository.delete(reaction);
        }

        // 2. Delete Comments and Likes
        reportRepository.deleteAll(reportRepository.findByPostId(postId));
        commentRepository.deleteAll(commentRepository.findByPostId(postId));
        likeRepository.deleteAll(likeRepository.findByPostId(postId));

        // 3. Nullify originalPost reference in SavedMeals
        List<SavedMeal> linkedMeals = savedMealRepository.findByOriginalPostId(postId);
        for(SavedMeal meal : linkedMeals) {
            meal.setOriginalPost(null);
            savedMealRepository.save(meal);
        }

        // 4. Clean up Post's Cloudinary media
        try {
            if (post.getMediaPublicId() != null) {
                cloudinary.uploader().destroy(post.getMediaPublicId(), ObjectUtils.emptyMap());
            }
            if (post.getFrontMediaPublicId() != null) {
                cloudinary.uploader().destroy(post.getFrontMediaPublicId(), ObjectUtils.emptyMap());
            }
        } catch (IOException e) {
            System.err.println("Warning: Cloudinary assets failed to delete for post: " + postId);
        }

        // 5. Delete post
        postRepository.delete(post);
    }

    /**
     * Fetches the feed.
     * REELS: Global content (TikTok style).
     * DAILY/MEAL: Friends only content (BeReal style).
     */
    public Page<PostResponse> getFeedByType(User user, PostType type, Pageable pageable) {
        if (type == PostType.REEL) {
            // Simplified global feed for Reels
            return postRepository.findAllByTypeOrderByCreatedAtDesc(type, pageable)
                    .map(post -> mapToResponse(post, user));
        }

        // Friends feed for social types
        return postRepository.findFriendsFeed(user.getId(), type, pageable)
                .map(post -> mapToResponse(post, user));
    }

    /**
     * Fetches posts created by the authenticated user.
     */
    public List<PostResponse> getMyPosts(User user) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(post -> mapToResponse(post, user))
                .toList();
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
     * Maps Entity to DTO with all social counts and status flags.
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
}
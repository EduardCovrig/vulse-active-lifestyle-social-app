package com.vulse.api.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vulse.api.backend.dtos.user.*;
import com.vulse.api.backend.models.*;
import com.vulse.api.backend.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final Cloudinary cloudinary;
    private final PostRepository postRepository;
    private final PostService postService;
    private final ReactionRepository reactionRepository;
    private final InteractionService interactionService;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final SavedMealRepository savedMealRepository;
    private final FollowRepository followRepository;
    private final ReportRepository reportRepository;
    private final BlockRepository blockRepository;
    private final NotificationRepository notificationRepository;

    @Transactional
    public void updateProfile(User user, String bio, MultipartFile profilePic,
                              Integer calGoal, Integer proGoal, Integer carbGoal, Integer fatGoal) throws IOException {
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (bio != null) dbUser.setBio(bio);
        if (calGoal != null) dbUser.setDailyCaloriesGoal(calGoal);
        if (proGoal != null) dbUser.setProteinGoal(proGoal);
        if (carbGoal != null) dbUser.setCarbsGoal(carbGoal);
        if (fatGoal != null) dbUser.setFatGoal(fatGoal);

        if (profilePic != null && !profilePic.isEmpty()) {
            String contentType = profilePic.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new IllegalArgumentException("Only images are allowed for profile pictures!");
            }
            if (dbUser.getProfilePicPublicId() != null) {
                try {
                    cloudinary.uploader().destroy(dbUser.getProfilePicPublicId(), ObjectUtils.emptyMap());
                } catch (Exception ignored) {}
            }
            Map uploadResult = cloudinary.uploader().upload(profilePic.getBytes(), ObjectUtils.asMap("resource_type", "image"));
            dbUser.setProfilePicUrl(uploadResult.get("secure_url").toString());
            dbUser.setProfilePicPublicId(uploadResult.get("public_id").toString());
        }

        userRepository.save(dbUser);
    }

    public void deleteAccount(User user) {
        List<String> cloudinaryIdsToDelete = deleteAccountDbWork(user);

        for (String publicId : cloudinaryIdsToDelete) {
            try {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            } catch (Exception ignored) {}
        }
    }

    @Transactional
    protected List<String> deleteAccountDbWork(User user) {
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        List<String> cloudinaryIds = new ArrayList<>();

        if (dbUser.getProfilePicPublicId() != null) {
            cloudinaryIds.add(dbUser.getProfilePicPublicId());
        }

        List<Post> userPosts = postRepository.findByUserIdOrderByCreatedAtDesc(dbUser.getId());
        for (Post post : userPosts) {
            List<String> postCloudinaryIds = postService.deletePostDbWork(post.getId(), dbUser);
            cloudinaryIds.addAll(postCloudinaryIds);
        }

        List<Reaction> userReactions = reactionRepository.findByUserId(dbUser.getId());
        for (Reaction reaction : userReactions) {
            if (reaction.getMediaPublicId() != null) {
                cloudinaryIds.add(reaction.getMediaPublicId());
            }
            reactionRepository.delete(reaction);
        }

        notificationRepository.deleteBySenderId(dbUser.getId());
        notificationRepository.deleteByRecipientId(dbUser.getId());

        likeRepository.deleteAll(likeRepository.findByUserId(dbUser.getId()));
        commentRepository.deleteAll(commentRepository.findByUserId(dbUser.getId()));
        savedMealRepository.deleteAll(savedMealRepository.findByUserId(dbUser.getId()));

        List<Follow> follows = followRepository.findByFollowerId(dbUser.getId());
        follows.addAll(followRepository.findByFollowingId(dbUser.getId()));
        followRepository.deleteAll(follows);

        reportRepository.deleteAll(reportRepository.findByReporterId(dbUser.getId()));

        List<Block> blocks = blockRepository.findByBlockerId(dbUser.getId());
        blocks.addAll(blockRepository.findByBlockedId(dbUser.getId()));
        blockRepository.deleteAll(blocks);

        userRepository.delete(dbUser);

        return cloudinaryIds;
    }

    public List<UserSearchResponse> searchUsers(User currentUser, String query) {
        String normalizedQuery = java.text.Normalizer.normalize(query, java.text.Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "").toLowerCase();
        
        List<User> myFollowing = followRepository.findByFollowerId(currentUser.getId())
                .stream().map(Follow::getFollowing).toList();

        return userRepository.findAll().stream()
                .filter(u -> {
                    String normName = java.text.Normalizer.normalize(u.getRealUsername(), java.text.Normalizer.Form.NFD)
                            .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "").toLowerCase();
                    return normName.contains(normalizedQuery) || 
                           u.getUsername().toLowerCase().contains(normalizedQuery);
                })
                .map(u -> {
                    // calculate mutual followers
                    List<User> userFollowers = followRepository.findByFollowingId(u.getId())
                            .stream().map(Follow::getFollower).toList();
                    List<User> mutuals = userFollowers.stream()
                            .filter(f -> myFollowing.stream().anyMatch(mf -> mf.getId().equals(f.getId()))).toList();
                    
                    String mutualsText = null;
                    if (!mutuals.isEmpty()) {
                        mutualsText = mutuals.get(0).getRealUsername();
                        if (mutuals.size() > 1) {
                            mutualsText += " + " + (mutuals.size() - 1) + " others follow";
                        } else {
                            mutualsText += " follows";
                        }
                    }

                    return UserSearchResponse.builder()
                            .id(u.getId())
                            .username(u.getRealUsername())
                            .profilePicUrl(u.getProfilePicUrl())
                            .mutualsText(mutualsText)
                            .build();
                }).collect(Collectors.toList());
    }

    public List<UserSuggestionResponse> getSuggestions(User currentUser) {
        List<User> myFollowing = followRepository.findByFollowerId(currentUser.getId())
                .stream().map(Follow::getFollowing).toList();

        Map<User, Long> potentialSuggestions = myFollowing.stream()
                .flatMap(friend -> followRepository.findByFollowerId(friend.getId()).stream().map(Follow::getFollowing))
                .filter(u -> !u.getId().equals(currentUser.getId())) // don't suggest myself
                .filter(u -> myFollowing.stream().noneMatch(mf -> mf.getId().equals(u.getId()))) // don't suggest people I already follow
                .collect(Collectors.groupingBy(u -> u, Collectors.counting()));

        List<UserSuggestionResponse> suggestions = potentialSuggestions.entrySet().stream()
                .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue())) // sort by number of mutuals desc
                .limit(10) // top 10
                .map(entry -> {
                    User u = entry.getKey();
                    return UserSuggestionResponse.builder()
                            .id(u.getId())
                            .username(u.getRealUsername())
                            .profilePicUrl(u.getProfilePicUrl())
                            .mutuals(entry.getValue())
                            .build();
                }).collect(Collectors.toCollection(ArrayList::new));

        // If not enough suggestions, fill with random users (just taking from all users)
        if (suggestions.size() < 5) {
            List<User> allUsers = userRepository.findAll();
            for (User u : allUsers) {
                if (suggestions.size() >= 10) break;
                if (!u.getId().equals(currentUser.getId()) &&
                    myFollowing.stream().noneMatch(mf -> mf.getId().equals(u.getId())) &&
                    suggestions.stream().noneMatch(s -> s.getId().equals(u.getId()))) {
                    suggestions.add(UserSuggestionResponse.builder()
                            .id(u.getId())
                            .username(u.getRealUsername())
                            .profilePicUrl(u.getProfilePicUrl())
                            .mutuals(0L)
                            .build());
                }
            }
        }

        return suggestions;
    }

    public List<UserCircleResponse> getVulseCircle(User currentUser) {
        List<User> following = followRepository.findByFollowerId(currentUser.getId())
                .stream().map(Follow::getFollowing).toList();

        java.time.LocalDateTime startOfDay = java.time.LocalDate.now().atStartOfDay();

        List<UserCircleResponse> circle = following.stream().map(friend -> {
            boolean hasPosted = false;
            String dailyPostUrl = null;

            Optional<Post> friendTodayPost = postRepository.findFirstByUserAndTypeAndCreatedAtAfterOrderByCreatedAtDesc(
                    friend, PostType.DAILY, startOfDay
            );

            if (friendTodayPost.isPresent()) {
                hasPosted = true;
                dailyPostUrl = friendTodayPost.get().getMediaUrl();
            }

            return UserCircleResponse.builder()
                    .id(friend.getId())
                    .name(friend.getRealUsername())
                    .img(friend.getProfilePicUrl())
                    .hasPosted(hasPosted)
                    .dailyPostUrl(dailyPostUrl)
                    .isMe(false)
                    .build();
        }).collect(Collectors.toCollection(ArrayList::new));

        // Check if current user posted today
        boolean meHasPosted = false;
        String meDailyPostUrl = null;

        Optional<Post> myTodayPost = postRepository.findFirstByUserAndTypeAndCreatedAtAfterOrderByCreatedAtDesc(
                currentUser, PostType.DAILY, startOfDay
        );

        if (myTodayPost.isPresent()) {
            meHasPosted = true;
            meDailyPostUrl = myTodayPost.get().getMediaUrl();
        }

        UserCircleResponse meCircle = UserCircleResponse.builder()
                .id(currentUser.getId())
                .name("Your Daily")
                .img(currentUser.getProfilePicUrl())
                .isMe(true)
                .hasPosted(meHasPosted)
                .dailyPostUrl(meDailyPostUrl)
                .build();

        circle.add(0, meCircle);

        return circle;
    }

    public UserProfileResponse getProfile(String username, User currentUser) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // SECURITY CHECK: 2-Way Block verification
        if (blockRepository.existsByBlockerIdAndBlockedId(currentUser.getId(), user.getId()) ||
                blockRepository.existsByBlockerIdAndBlockedId(user.getId(), currentUser.getId())) {
            throw new IllegalStateException("Profile is unavailable.");
        }

        long followingCount = followRepository.countByFollowerId(user.getId());
        long followersCount = followRepository.countByFollowingId(user.getId());
        boolean isFollowing = followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), user.getId());

        int streak = calculateStreak(user.getId());
        List<String> calendarSnaps = getCalendarSnaps(user.getId());

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getRealUsername())
                .bio(user.getBio())
                .profilePicUrl(user.getProfilePicUrl())
                .followingCount(followingCount)
                .followersCount(followersCount)
                .isFollowing(isFollowing)
                .streak(streak)
                .calendarSnaps(calendarSnaps)
                .build();
    }

    public List<UserSummaryResponse> getFollowers(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        return followRepository.findByFollowingId(user.getId()).stream()
                .map(Follow::getFollower)
                .map(u -> UserSummaryResponse.builder()
                        .id(u.getId())
                        .username(u.getRealUsername())
                        .profilePicUrl(u.getProfilePicUrl())
                        .build())
                .collect(Collectors.toList());
    }

    public List<UserSummaryResponse> getFollowing(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        return followRepository.findByFollowerId(user.getId()).stream()
                .map(Follow::getFollowing)
                .map(u -> UserSummaryResponse.builder()
                        .id(u.getId())
                        .username(u.getRealUsername())
                        .profilePicUrl(u.getProfilePicUrl())
                        .build())
                .collect(Collectors.toList());
    }

    public List<CalendarSnapResponse> getCalendar(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        return postRepository.findTop365ByUserIdAndTypeOrderByCreatedAtDesc(user.getId(), PostType.DAILY).stream()
                .map(p -> CalendarSnapResponse.builder()
                        .date(p.getCreatedAt().toLocalDate().toString())
                        .mediaUrl(p.getMediaUrl())
                        .build())
                .collect(Collectors.toList());
    }

    public CurrentUserResponse getCurrentUser(User user) {
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        long followingCount = followRepository.countByFollowerId(dbUser.getId());
        long followersCount = followRepository.countByFollowingId(dbUser.getId());

        int streak = calculateStreak(dbUser.getId());
        List<String> calendarSnaps = getCalendarSnaps(dbUser.getId());

        return CurrentUserResponse.builder()
                .id(dbUser.getId())
                .username(dbUser.getRealUsername())
                .email(dbUser.getEmail())
                .bio(dbUser.getBio())
                .profilePicUrl(dbUser.getProfilePicUrl())
                .followingCount(followingCount)
                .followersCount(followersCount)
                .dailyCaloriesGoal(dbUser.getDailyCaloriesGoal())
                .proteinGoal(dbUser.getProteinGoal())
                .carbsGoal(dbUser.getCarbsGoal())
                .fatGoal(dbUser.getFatGoal())
                .streak(streak)
                .calendarSnaps(calendarSnaps)
                .build();
    }

    public int calculateStreak(UUID userId) {
        List<java.time.LocalDate> postDates = postRepository.findTop30ByUserIdAndTypeOrderByCreatedAtDesc(userId, PostType.DAILY)
                .stream().map(p -> p.getCreatedAt().toLocalDate()).distinct().toList();

        if (postDates.isEmpty()) return 0;

        int streak = 0;
        java.time.LocalDate checkDate = java.time.LocalDate.now();

        if (!postDates.contains(checkDate)) {
            checkDate = checkDate.minusDays(1); // Daca n-a postat azi, inca nu si-a pierdut streak-ul (poate posta pana la 23:59)
        }

        for (java.time.LocalDate date : postDates) {
            if (date.equals(checkDate)) {
                streak++;
                checkDate = checkDate.minusDays(1);
            } else {
                break;
            }
        }
        return streak;
    }

    public List<String> getCalendarSnaps(UUID userId) {
        return postRepository.findTop7ByUserIdAndTypeOrderByCreatedAtDesc(userId, PostType.DAILY)
                .stream().map(com.vulse.api.backend.models.Post::getMediaUrl).toList();
    }

    @Transactional
    public void followUser(User currentUser, UUID userId) {
        if (currentUser.getId().equals(userId)) {
            throw new IllegalArgumentException("You cannot follow yourself.");
        }

        User toFollow = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));
        if (followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), userId)) {
            Follow follow = followRepository.findByFollowerIdAndFollowingId(currentUser.getId(), userId)
                    .orElseThrow(() -> new IllegalStateException("Follow record not found"));
            followRepository.delete(follow);
        } else {
            followRepository.save(Follow.builder().follower(currentUser).following(toFollow).build());

            // sends notification to followed user
            notificationRepository.save(Notification.builder()
                    .recipient(toFollow)
                    .sender(currentUser)
                    .type(NotificationType.FOLLOW)
                    .isRead(false)
                    .build());
        }
    }
}
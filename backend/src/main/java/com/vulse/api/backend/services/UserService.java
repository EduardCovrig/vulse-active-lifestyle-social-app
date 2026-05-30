package com.vulse.api.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
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
}
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

    // Dependencies required for GDPR cleanup
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

    /**
     * Updates bio and profile picture.
     */
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

    /**
     * Fully cascades deletions to prevent DB crashes and cleans Cloudinary to prevent billing issues.
     * Cloudinary HTTP calls are performed AFTER the DB transaction commits to avoid
     * holding a DB connection during potentially slow external HTTP calls.
     */
    public void deleteAccount(User user) {
        // Phase 1: All DB operations inside a transaction; collect Cloudinary IDs
        List<String> cloudinaryIdsToDelete = deleteAccountDbWork(user);

        // Phase 2: Cloudinary cleanup OUTSIDE the transaction
        for (String publicId : cloudinaryIdsToDelete) {
            try {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            } catch (Exception ignored) {}
        }
    }

    /**
     * Transactional phase of deleteAccount — does all DB work and returns Cloudinary public IDs to clean up.
     */
    @Transactional
    protected List<String> deleteAccountDbWork(User user) {
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        List<String> cloudinaryIds = new ArrayList<>();

        // Collect profile pic Cloudinary ID
        if (dbUser.getProfilePicPublicId() != null) {
            cloudinaryIds.add(dbUser.getProfilePicPublicId());
        }

        // Delete all user's posts (which also collects their Cloudinary IDs)
        List<Post> userPosts = postRepository.findByUserIdOrderByCreatedAtDesc(dbUser.getId());
        for (Post post : userPosts) {
            List<String> postCloudinaryIds = postService.deletePostDbWork(post.getId(), dbUser);
            cloudinaryIds.addAll(postCloudinaryIds);
        }

        // Delete remaining reactions and collect their Cloudinary IDs
        List<Reaction> userReactions = reactionRepository.findByUserId(dbUser.getId());
        for (Reaction reaction : userReactions) {
            if (reaction.getMediaPublicId() != null) {
                cloudinaryIds.add(reaction.getMediaPublicId());
            }
            reactionRepository.delete(reaction);
        }

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
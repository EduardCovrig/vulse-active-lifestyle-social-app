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
    public void updateProfile(User user, String bio, MultipartFile profilePic) throws IOException {
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (bio != null) {
            dbUser.setBio(bio);
        }

        if (profilePic != null && !profilePic.isEmpty()) {
            // Delete old profile picture from Cloudinary if it exists
            if (dbUser.getProfilePicPublicId() != null) {
                try {
                    cloudinary.uploader().destroy(dbUser.getProfilePicPublicId(), ObjectUtils.emptyMap());
                } catch (Exception ignored) {}
            }

            // Upload new picture
            Map uploadResult = cloudinary.uploader().upload(profilePic.getBytes(), ObjectUtils.asMap("resource_type", "image"));
            dbUser.setProfilePicUrl(uploadResult.get("secure_url").toString());
            dbUser.setProfilePicPublicId(uploadResult.get("public_id").toString());
        }

        userRepository.save(dbUser);
    }

    /**
     * Fully cascades deletions to prevent DB crashes and cleans Cloudinary to prevent billing issues.
     */
    @Transactional
    public void deleteAccount(User user) {
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (dbUser.getProfilePicPublicId() != null) {
            try {
                cloudinary.uploader().destroy(dbUser.getProfilePicPublicId(), ObjectUtils.emptyMap());
            } catch (Exception ignored) {}
        }

        List<Post> userPosts = postRepository.findByUserIdOrderByCreatedAtDesc(dbUser.getId());
        for (Post post : userPosts) {
            postService.deletePost(post.getId(), dbUser);
        }

        // 3. DELETE REMAINING INTERACTIONS EFFICIENTLY
        List<Reaction> userReactions = reactionRepository.findByUserId(dbUser.getId());
        for (Reaction reaction : userReactions) {
            interactionService.deleteReaction(dbUser, reaction.getId());
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
    }
}
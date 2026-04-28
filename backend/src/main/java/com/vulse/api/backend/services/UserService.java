package com.vulse.api.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vulse.api.backend.models.Follow;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.Reaction;
import com.vulse.api.backend.models.User;
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

    // Injectam dependentele necesare pentru curatenia de GDPR
    private final PostRepository postRepository;
    private final PostService postService;
    private final ReactionRepository reactionRepository;
    private final InteractionService interactionService;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;
    private final SavedMealRepository savedMealRepository;
    private final FollowRepository followRepository;

    @Transactional
    public void updateProfile(User user, String bio, MultipartFile profilePic) throws IOException {
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        if (bio != null) {
            dbUser.setBio(bio);
        }

        if (profilePic != null && !profilePic.isEmpty()) {
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

    @Transactional
    public void deleteAccount(User user) {
        User dbUser = userRepository.findById(user.getId())
                .orElseThrow(() -> new IllegalStateException("User not found"));

        // 1. DELETE PROFILE PICTURE FROM CLOUDINARY
        if (dbUser.getProfilePicPublicId() != null) {
            try {
                cloudinary.uploader().destroy(dbUser.getProfilePicPublicId(), ObjectUtils.emptyMap());
            } catch (Exception ignored) {}
        }

        // 2. DELETE ALL POSTS (This triggers PostService to delete Cloudinary images too)
        List<Post> userPosts = postRepository.findByUserIdOrderByCreatedAtDesc(dbUser.getId());
        for (Post post : userPosts) {
            postService.deletePost(post.getId(), dbUser);
        }

        // 3. DELETE ALL REACTIONS (RealMojis - Triggers Cloudinary cleanup)
        List<Reaction> userReactions = reactionRepository.findAll().stream()
                .filter(r -> r.getUser().getId().equals(dbUser.getId()))
                .toList();
        for (Reaction reaction : userReactions) {
            interactionService.deleteReaction(dbUser, reaction.getId());
        }

        // 4. CLEAN UP DATABASE ASSOCIATIONS (Likes, Comments, Meals, Follows)
        likeRepository.findAll().stream()
                .filter(l -> l.getUser().getId().equals(dbUser.getId()))
                .forEach(likeRepository::delete);

        commentRepository.findAll().stream()
                .filter(c -> c.getUser().getId().equals(dbUser.getId()))
                .forEach(commentRepository::delete);

        savedMealRepository.findAll().stream()
                .filter(m -> m.getUser().getId().equals(dbUser.getId()))
                .forEach(savedMealRepository::delete);

        // Delete follows where user is follower OR following
        List<Follow> follows = followRepository.findAll().stream()
                .filter(f -> f.getFollower().getId().equals(dbUser.getId()) || f.getFollowing().getId().equals(dbUser.getId()))
                .toList();
        followRepository.deleteAll(follows);

        // 5. FINALLY, DELETE THE USER
        userRepository.delete(dbUser);
    }
}
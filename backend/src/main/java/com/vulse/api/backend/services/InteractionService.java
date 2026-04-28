package com.vulse.api.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vulse.api.backend.models.Like;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.Reaction;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.LikeRepository;
import com.vulse.api.backend.repositories.PostRepository;
import com.vulse.api.backend.repositories.ReactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InteractionService {
    private final LikeRepository likeRepository;
    private final ReactionRepository reactionRepository;
    private final PostRepository postRepository;
    private final Cloudinary cloudinary;

    @Transactional
    public void toggleLike(User user, UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalStateException("Post not found"));

        // If like exists, remove it. Otherwise, add it.
        likeRepository.findByUserIdAndPostId(user.getId(), postId)
                .ifPresentOrElse(
                        likeRepository::delete,
                        () -> likeRepository.save(Like.builder().user(user).post(post).build())
                );
    }

    @Transactional
    public void addReaction(User user, UUID postId, MultipartFile file) throws IOException {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalStateException("Post not found"));

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("resource_type", "image"));

        Reaction reaction = Reaction.builder()
                .user(user)
                .post(post)
                .mediaUrl(uploadResult.get("secure_url").toString())
                .mediaPublicId(uploadResult.get("public_id").toString())
                .build();

        reactionRepository.save(reaction);
    }

    @Transactional
    public void deleteReaction(User user, UUID reactionId) {
        Reaction reaction = reactionRepository.findById(reactionId)
                .orElseThrow(() -> new IllegalStateException("Reaction not found"));

        if (!reaction.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized: You can only delete your own reactions");
        }

        try {
            if (reaction.getMediaPublicId() != null) {
                cloudinary.uploader().destroy(reaction.getMediaPublicId(), ObjectUtils.emptyMap());
            }
        } catch (IOException e) {
            System.err.println("Warning: Failed to delete reaction media from Cloudinary.");
        }

        reactionRepository.delete(reaction);
    }
}
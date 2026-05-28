package com.vulse.api.backend.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.vulse.api.backend.models.*;
import com.vulse.api.backend.repositories.LikeRepository;
import com.vulse.api.backend.repositories.NotificationRepository;
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
    private final NotificationRepository notificationRepository;

    @Transactional
    public void toggleLike(User user, UUID postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalStateException("Post not found"));

        // If like exists, remove it. Otherwise, add it.
        likeRepository.findByUserIdAndPostId(user.getId(), postId)
                .ifPresentOrElse(
                        likeRepository::delete,
                        () -> {
                            likeRepository.save(Like.builder().user(user).post(post).build());

                            // sends notificaiton to original user (if he isn't the one who liked it)
                            if (!post.getUser().getId().equals(user.getId())) {
                                notificationRepository.save(Notification.builder()
                                        .recipient(post.getUser())
                                        .sender(user)
                                        .type(NotificationType.LIKE)
                                        .post(post)
                                        .isRead(false)
                                        .build());
                            }
                        }
                );
    }

    @Transactional
    public void addReaction(User user, UUID postId, MultipartFile file, String message) throws IOException {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalStateException("Post not found"));

        Map uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap("resource_type", "image"));

        Reaction reaction = Reaction.builder()
                .user(user)
                .post(post)
                .mediaUrl(uploadResult.get("secure_url").toString())
                .mediaPublicId(uploadResult.get("public_id").toString())
                .message(message)
                .build();

        reactionRepository.save(reaction);
    }

    /**
     * Deletes a reaction. Cloudinary HTTP calls are performed AFTER the DB transaction
     * commits to avoid holding a DB connection during potentially slow external HTTP calls.
     */
    public void deleteReaction(User user, UUID reactionId) {
        // Phase 1: DB work inside transaction; collect Cloudinary ID
        String mediaPublicId = deleteReactionDbWork(user, reactionId);

        // Phase 2: Cloudinary cleanup OUTSIDE the transaction
        if (mediaPublicId != null) {
            try {
                cloudinary.uploader().destroy(mediaPublicId, ObjectUtils.emptyMap());
            } catch (IOException e) {
                System.err.println("Warning: Failed to delete reaction media from Cloudinary.");
            }
        }
    }

    /**
     * Transactional phase of deleteReaction — does DB work and returns the Cloudinary public ID to clean up.
     */
    @Transactional
    protected String deleteReactionDbWork(User user, UUID reactionId) {
        Reaction reaction = reactionRepository.findById(reactionId)
                .orElseThrow(() -> new IllegalStateException("Reaction not found"));

        if (!reaction.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Unauthorized: You can only delete your own reactions");
        }

        String publicId = reaction.getMediaPublicId();
        reactionRepository.delete(reaction);
        return publicId;
    }
}
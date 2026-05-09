package com.vulse.api.backend.services;

import com.vulse.api.backend.models.Comment;
import com.vulse.api.backend.models.Notification;
import com.vulse.api.backend.models.NotificationType;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.CommentRepository;
import com.vulse.api.backend.repositories.NotificationRepository;
import com.vulse.api.backend.repositories.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final NotificationRepository notificationRepository;

    public void addComment(User user, UUID postId, String text, String parentIdStr) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalStateException("Post not found"));

        Comment parent = null;
        if (parentIdStr != null && !parentIdStr.trim().isEmpty()) {
            parent = commentRepository.findById(UUID.fromString(parentIdStr)).orElse(null);
        }

        Comment comment = Comment.builder()
                .user(user)
                .post(post)
                .text(text)
                .parentComment(parent)
                .build();

        commentRepository.save(comment);

        // notifies the original poster
        if (!post.getUser().getId().equals(user.getId())) {
            notificationRepository.save(Notification.builder()
                    .recipient(post.getUser())
                    .sender(user)
                    .type(NotificationType.COMMENT)
                    .post(post)
                    .isRead(false)
                    .build());
        }

        // notifies the original commenter
        if (parent != null && !parent.getUser().getId().equals(user.getId())) {
            notificationRepository.save(Notification.builder()
                    .recipient(parent.getUser())
                    .sender(user)
                    .type(NotificationType.COMMENT)
                    .post(post)
                    .isRead(false)
                    .build());
        }
    }

    public Page<Comment> getCommentsForPost(UUID postId, Pageable pageable) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable);
    }

    public void deleteComment(User user, UUID commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalStateException("Comment not found"));

        // Security: You can delete if you are the comment author OR the post author
        boolean isCommentOwner = comment.getUser().getId().equals(user.getId());
        boolean isPostOwner = comment.getPost().getUser().getId().equals(user.getId());

        if (!isCommentOwner && !isPostOwner) {
            throw new IllegalStateException("Unauthorized: You can only delete your own comments or comments on your posts");
        }

        commentRepository.delete(comment);
    }
}
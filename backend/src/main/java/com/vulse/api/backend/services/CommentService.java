package com.vulse.api.backend.services;

import com.vulse.api.backend.models.Comment;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.CommentRepository;
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

    public void addComment(User user, UUID postId, String text) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalStateException("Post not found"));

        Comment comment = Comment.builder()
                .user(user)
                .post(post)
                .text(text)
                .build();

        commentRepository.save(comment);
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
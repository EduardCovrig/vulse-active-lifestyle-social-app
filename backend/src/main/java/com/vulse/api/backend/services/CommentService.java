package com.vulse.api.backend.services;

import com.vulse.api.backend.models.Comment;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.CommentRepository;
import com.vulse.api.backend.repositories.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
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

    public List<Comment> getCommentsForPost(UUID postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }
}
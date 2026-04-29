package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    Page<Comment> findByPostIdOrderByCreatedAtDesc(UUID postId, Pageable pageable);
    long countByPostId(UUID postId);

    List<Comment> findByPostId(UUID postId);
    List<Comment> findByUserId(UUID userId);
}
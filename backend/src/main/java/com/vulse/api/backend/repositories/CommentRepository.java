package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    Page<Comment> findByPostIdOrderByCreatedAtDesc(UUID postId, Pageable pageable);
    long countByPostId(UUID postId);

    List<Comment> findByPostId(UUID postId);
    List<Comment> findByUserId(UUID userId);

    // Batch: count comments grouped by post ID (returns Object[]{postId, count})
    @Query("SELECT c.post.id, COUNT(c) FROM Comment c WHERE c.post.id IN :postIds GROUP BY c.post.id")
    List<Object[]> countGroupedByPostIds(@Param("postIds") Collection<UUID> postIds);
}
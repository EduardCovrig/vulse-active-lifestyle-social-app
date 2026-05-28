package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LikeRepository extends JpaRepository<Like, UUID> {
    Optional<Like> findByUserIdAndPostId(UUID userId, UUID postId);
    long countByPostId(UUID postId);
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);

    List<Like> findByPostId(UUID postId);
    List<Like> findByUserId(UUID userId);

    // Batch: count likes grouped by post ID (returns Object[]{postId, count})
    @Query("SELECT l.post.id, COUNT(l) FROM Like l WHERE l.post.id IN :postIds GROUP BY l.post.id")
    List<Object[]> countGroupedByPostIds(@Param("postIds") Collection<UUID> postIds);

    // Batch: find which posts a user has liked from a given set
    @Query("SELECT l.post.id FROM Like l WHERE l.user.id = :userId AND l.post.id IN :postIds")
    List<UUID> findLikedPostIdsByUser(@Param("userId") UUID userId, @Param("postIds") Collection<UUID> postIds);
}
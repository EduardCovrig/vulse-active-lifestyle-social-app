package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Like;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface LikeRepository extends JpaRepository<Like, UUID> {
    Optional<Like> findByUserIdAndPostId(UUID userId, UUID postId);
    long countByPostId(UUID postId);
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);
}
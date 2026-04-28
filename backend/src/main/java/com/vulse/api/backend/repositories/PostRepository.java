package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
    Page<Post> findAllByTypeOrderByCreatedAtDesc(PostType type, Pageable pageable);
    List<Post> findByUserIdOrderByCreatedAtDesc(UUID userId);

    // Check if a user has already posted a specific type of post after a given time
    boolean existsByUserIdAndTypeAndCreatedAtAfter(UUID userId, PostType type, LocalDateTime time);
}

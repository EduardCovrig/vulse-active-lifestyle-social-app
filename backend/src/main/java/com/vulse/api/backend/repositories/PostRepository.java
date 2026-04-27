package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
    Page<Post> findAllByTypeOrderByCreatedAtDesc(PostType type, Pageable pageable);
    List<Post> findByUserIdOrderByCreatedAtDesc(UUID userId);
}

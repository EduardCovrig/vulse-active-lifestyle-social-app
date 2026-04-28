package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Reaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ReactionRepository extends JpaRepository<Reaction, UUID> {
    // Fetch only the latest 3 reactions for the feed UI cluster
    List<Reaction> findTop3ByPostIdOrderByCreatedAtDesc(UUID postId);
}
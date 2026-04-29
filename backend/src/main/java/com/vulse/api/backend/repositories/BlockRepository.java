package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BlockRepository extends JpaRepository<Block, UUID> {
    List<Block> findByBlockerId(UUID blockerId);
    List<Block> findByBlockedId(UUID blockedId);

    Optional<Block> findByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);
    boolean existsByBlockerIdAndBlockedId(UUID blockerId, UUID blockedId);
}
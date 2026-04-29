package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface BlockRepository extends JpaRepository<Block, UUID> {
    List<Block> findByBlockerId(UUID blockerId);
    List<Block> findByBlockedId(UUID blockedId);
}
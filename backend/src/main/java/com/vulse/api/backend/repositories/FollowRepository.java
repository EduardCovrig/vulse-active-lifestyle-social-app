package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FollowRepository extends JpaRepository<Follow, UUID> {
    Optional<Follow> findByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
    List<Follow> findByFollowerId(UUID followerId); // Who I follow
    List<Follow> findByFollowingId(UUID followingId); // Who follows me
    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);

    long countByFollowerId(UUID followerId);
    long countByFollowingId(UUID followingId);
}
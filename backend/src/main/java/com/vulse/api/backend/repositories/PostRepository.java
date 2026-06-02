package com.vulse.api.backend.repositories;

import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.PostType;
import com.vulse.api.backend.models.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PostRepository extends JpaRepository<Post, UUID> {
    Page<Post> findAllByTypeOrderByCreatedAtDesc(PostType type, Pageable pageable);
    List<Post> findByUserIdOrderByCreatedAtDesc(UUID userId);

    // Check if a user has already posted a specific type of post after a given time
    boolean existsByUserIdAndTypeAndCreatedAtAfter(UUID userId, PostType type, LocalDateTime time);

    @Query(value = "SELECT p FROM Post p JOIN FETCH p.user WHERE (p.user.id = :currentUserId OR p.user.id IN " +
            "(SELECT f.following.id FROM Follow f WHERE f.follower.id = :currentUserId)) " +
            "AND p.user.id NOT IN (SELECT b.blocked.id FROM Block b WHERE b.blocker.id = :currentUserId) " +
            "AND p.user.id NOT IN (SELECT b.blocker.id FROM Block b WHERE b.blocked.id = :currentUserId) " +
            "AND p.type = :type ORDER BY p.createdAt DESC",
           countQuery = "SELECT COUNT(p) FROM Post p WHERE (p.user.id = :currentUserId OR p.user.id IN " +
            "(SELECT f.following.id FROM Follow f WHERE f.follower.id = :currentUserId)) " +
            "AND p.user.id NOT IN (SELECT b.blocked.id FROM Block b WHERE b.blocker.id = :currentUserId) " +
            "AND p.user.id NOT IN (SELECT b.blocker.id FROM Block b WHERE b.blocked.id = :currentUserId) " +
            "AND p.type = :type")
    Page<Post> findFriendsFeed(@Param("currentUserId") UUID currentUserId,
                               @Param("type") PostType type,
                               Pageable pageable);

    @Query(value = "SELECT p FROM Post p JOIN FETCH p.user WHERE p.type = :type " +
            "AND p.user.id NOT IN (SELECT b.blocked.id FROM Block b WHERE b.blocker.id = :currentUserId) " +
            "AND p.user.id NOT IN (SELECT b.blocker.id FROM Block b WHERE b.blocked.id = :currentUserId) " +
            "ORDER BY p.createdAt DESC",
           countQuery = "SELECT COUNT(p) FROM Post p WHERE p.type = :type " +
            "AND p.user.id NOT IN (SELECT b.blocked.id FROM Block b WHERE b.blocker.id = :currentUserId) " +
            "AND p.user.id NOT IN (SELECT b.blocker.id FROM Block b WHERE b.blocked.id = :currentUserId)")
    Page<Post> findSafeReelsFeed(@Param("currentUserId") UUID currentUserId,
                                 @Param("type") PostType type,
                                 Pageable pageable);

    @Query(value = "SELECT p FROM Post p JOIN FETCH p.user WHERE p.type = :type " +
            "AND p.user.id NOT IN (SELECT b.blocked.id FROM Block b WHERE b.blocker.id = :currentUserId) " +
            "AND p.user.id NOT IN (SELECT b.blocker.id FROM Block b WHERE b.blocked.id = :currentUserId)")
    List<Post> findAllSafeVideosList(@Param("currentUserId") UUID currentUserId,
                                     @Param("type") PostType type);

    //last 30 posts for streak
    List<Post> findTop30ByUserIdAndTypeOrderByCreatedAtDesc(UUID userId, PostType type);

    // last 7 daily posts for visual calendar
    List<Post> findTop7ByUserIdAndTypeOrderByCreatedAtDesc(UUID userId, PostType type);

    // last 365 daily posts for full calendar
    List<Post> findTop365ByUserIdAndTypeOrderByCreatedAtDesc(UUID userId, PostType type);

    Optional<Post> findFirstByUserAndTypeAndCreatedAtAfterOrderByCreatedAtDesc(User friend, PostType postType, LocalDateTime startOfDay);
}
package com.vulse.api.backend.controllers;

import com.vulse.api.backend.models.Block;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.Report;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.BlockRepository;
import com.vulse.api.backend.repositories.PostRepository;
import com.vulse.api.backend.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/safety")
@RequiredArgsConstructor
public class SafetyController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final BlockRepository blockRepository;
    private final EntityManager entityManager;

    @PostMapping("/block/{userId}")
    @Transactional
    public ResponseEntity<Void> toggleBlock(@AuthenticationPrincipal User currentUser, @PathVariable UUID userId) {
        if (currentUser.getId().equals(userId)) {
            return ResponseEntity.badRequest().build(); // Can't block yourself
        }

        User userToBlock = userRepository.findById(userId).orElseThrow();

        // Toggle logic: If blocked, unblock. If not, block.
        blockRepository.findByBlockerIdAndBlockedId(currentUser.getId(), userId)
                .ifPresentOrElse(
                        blockRepository::delete,
                        () -> {
                            blockRepository.save(Block.builder().blocker(currentUser).blocked(userToBlock).build());
                            // Automatically unfollow if blocking
                            entityManager.createQuery("DELETE FROM Follow f WHERE f.follower.id = :cId AND f.following.id = :uId")
                                    .setParameter("cId", currentUser.getId())
                                    .setParameter("uId", userId)
                                    .executeUpdate();
                        }
                );

        return ResponseEntity.ok().build();
    }

    @PostMapping("/report/post/{postId}")
    @Transactional
    public ResponseEntity<Void> reportPost(@AuthenticationPrincipal User reporter, @PathVariable UUID postId, @RequestBody Map<String, String> body) {
        Post post = postRepository.findById(postId).orElseThrow();
        Report report = Report.builder()
                .reporter(reporter)
                .post(post)
                .reason(body.getOrDefault("reason", "Inappropriate content"))
                .build();
        entityManager.persist(report);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/blocked")
    public ResponseEntity<List<Map<String, Object>>> getBlockedUsers(@AuthenticationPrincipal User currentUser) {
        List<Map<String, Object>> blockedUsers = blockRepository.findByBlockerId(currentUser.getId())
                .stream()
                .map(block -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", block.getBlocked().getId());
                    map.put("username", block.getBlocked().getUsername());
                    map.put("profilePicUrl", block.getBlocked().getProfilePicUrl());
                    return map;
                })
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(blockedUsers);
    }
}
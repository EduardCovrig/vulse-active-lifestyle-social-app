package com.vulse.api.backend.controllers;

import com.vulse.api.backend.models.Block;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.Report;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.PostRepository;
import com.vulse.api.backend.repositories.UserRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/safety")
@RequiredArgsConstructor
public class SafetyController {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final EntityManager entityManager;

    @PostMapping("/block/{userId}")
    @Transactional
    public ResponseEntity<Void> blockUser(@AuthenticationPrincipal User currentUser, @PathVariable UUID userId) {
        User userToBlock = userRepository.findById(userId).orElseThrow();
        Block block = Block.builder().blocker(currentUser).blocked(userToBlock).build();
        entityManager.persist(block);

        // Conform politicilor, daca ii dai block, ii dai si unfollow automat (daca il urmareai)
        entityManager.createQuery("DELETE FROM Follow f WHERE f.follower.id = :cId AND f.following.id = :uId")
                .setParameter("cId", currentUser.getId())
                .setParameter("uId", userId)
                .executeUpdate();

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
}
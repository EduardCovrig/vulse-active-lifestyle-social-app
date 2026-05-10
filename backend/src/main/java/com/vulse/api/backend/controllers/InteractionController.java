package com.vulse.api.backend.controllers;

import com.vulse.api.backend.models.Reaction;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.ReactionRepository;
import com.vulse.api.backend.services.InteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/interactions")
@RequiredArgsConstructor
public class InteractionController {
    private final InteractionService interactionService;
    private final ReactionRepository reactionRepository;

    @PostMapping("/{postId}/like")
    public ResponseEntity<Void> toggleLike(@AuthenticationPrincipal User user, @PathVariable UUID postId) {
        interactionService.toggleLike(user, postId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{postId}/react")
    public ResponseEntity<Void> addReaction(@AuthenticationPrincipal User user, @PathVariable UUID postId, @RequestParam("file") MultipartFile file) throws IOException {
        interactionService.addReaction(user, postId, file);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/react/{reactionId}")
    public ResponseEntity<Void> deleteReaction(@AuthenticationPrincipal User user, @PathVariable UUID reactionId) {
        interactionService.deleteReaction(user, reactionId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{postId}/reactions")
    public ResponseEntity<List<Map<String, Object>>> getReactions(@PathVariable UUID postId) {
        List<Reaction> reactions = reactionRepository.findByPostId(postId);
        List<Map<String, Object>> result = reactions.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getId());
            map.put("mediaUrl", r.getMediaUrl());
            map.put("username", r.getUser().getRealUsername());
            map.put("profilePicUrl", r.getUser().getProfilePicUrl());
            map.put("createdAt", r.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }
}
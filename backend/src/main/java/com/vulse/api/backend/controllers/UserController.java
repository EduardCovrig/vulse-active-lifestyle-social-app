package com.vulse.api.backend.controllers;

import com.vulse.api.backend.models.Follow;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.FollowRepository;
import com.vulse.api.backend.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final FollowRepository followRepository;

    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(userRepository.findAll().stream()
                .filter(u -> u.getUsername().toLowerCase().contains(query.toLowerCase()))
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("username", u.getUsername());
                    map.put("profilePicUrl", u.getProfilePicUrl());
                    return map;
                }).collect(Collectors.toList()));
    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<Void> followUser(@AuthenticationPrincipal User currentUser, @PathVariable UUID userId) {
        User toFollow = userRepository.findById(userId).orElseThrow();
        if (followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), userId)) {
            Follow follow = followRepository.findByFollowerIdAndFollowingId(currentUser.getId(), userId).orElseThrow();
            followRepository.delete(follow);
        } else {
            followRepository.save(Follow.builder().follower(currentUser).following(toFollow).build());
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{username}/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable String username, @AuthenticationPrincipal User currentUser) {
        User user = userRepository.findByUsername(username).orElseThrow();
        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("bio", user.getBio());
        profile.put("profilePicUrl", user.getProfilePicUrl());
        profile.put("followingCount", followRepository.findByFollowerId(user.getId()).size());
        profile.put("followersCount", followRepository.findByFollowingId(user.getId()).size());
        profile.put("isFollowing", followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), user.getId()));
        return ResponseEntity.ok(profile);
    }
}
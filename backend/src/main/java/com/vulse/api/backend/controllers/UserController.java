package com.vulse.api.backend.controllers;

import com.vulse.api.backend.models.Follow;
import com.vulse.api.backend.models.PostType;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.BlockRepository;
import com.vulse.api.backend.repositories.FollowRepository;
import com.vulse.api.backend.repositories.PostRepository;
import com.vulse.api.backend.repositories.UserRepository;
import com.vulse.api.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usgers")
@RequiredArgsConstructor
public class UserController {
    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final UserService userService;
    private final BlockRepository blockRepository;
    private final PostRepository postRepository;

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
        if (currentUser.getId().equals(userId)) {
            throw new IllegalArgumentException("You cannot follow yourself.");
        }

        User toFollow = userRepository.findById(userId).orElseThrow();
        if (followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), userId)) {
            Follow follow = followRepository.findByFollowerIdAndFollowingId(currentUser.getId(), userId).orElseThrow();
            followRepository.delete(follow);
        } else {
            followRepository.save(Follow.builder().follower(currentUser).following(toFollow).build());
        }
        return ResponseEntity.ok().build();
    }
    @GetMapping("/circle")
    public ResponseEntity<List<Map<String, Object>>> getVulseCircle(@AuthenticationPrincipal User currentUser) {
        List<User> following = followRepository.findByFollowerId(currentUser.getId())
                .stream().map(Follow::getFollowing).toList();

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        List<Map<String, Object>> circle = following.stream().map(friend -> {
            boolean hasPosted = postRepository.existsByUserIdAndTypeAndCreatedAtAfter(friend.getId(), PostType.DAILY, startOfDay);
            Map<String, Object> map = new HashMap<>();
            map.put("id", friend.getId());
            map.put("name", friend.getUsername());
            map.put("img", friend.getProfilePicUrl());
            map.put("hasPosted", hasPosted);
            map.put("isMe", false);
            return map;
        }).collect(Collectors.toList());

        // Verificam si daca userul curent a postat azi
        boolean iPosted = postRepository.existsByUserIdAndTypeAndCreatedAtAfter(currentUser.getId(), PostType.DAILY, startOfDay);
        Map<String, Object> meMap = new HashMap<>();
        meMap.put("id", currentUser.getId());
        meMap.put("name", "Your Daily");
        meMap.put("img", currentUser.getProfilePicUrl());
        meMap.put("hasPosted", iPosted);
        meMap.put("isMe", true);
        circle.add(0, meMap);

        return ResponseEntity.ok(circle);
    }

    @GetMapping("/{username}/profile")
    public ResponseEntity<Map<String, Object>> getProfile(@PathVariable String username, @AuthenticationPrincipal User currentUser) {
        User user = userRepository.findByUsername(username).orElseThrow();

        // SECURITY CHECK: 2-Way Block verification
        if (blockRepository.existsByBlockerIdAndBlockedId(currentUser.getId(), user.getId()) ||
                blockRepository.existsByBlockerIdAndBlockedId(user.getId(), currentUser.getId())) {
            throw new IllegalStateException("Profile is unavailable.");
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("bio", user.getBio());
        profile.put("profilePicUrl", user.getProfilePicUrl());
        profile.put("followingCount", followRepository.findByFollowerId(user.getId()).size());
        profile.put("followersCount", followRepository.findByFollowingId(user.getId()).size());
        profile.put("isFollowing", followRepository.existsByFollowerIdAndFollowingId(currentUser.getId(), user.getId()));

        // Date noi pentru UX-ul frontend-ului
        profile.put("streak", calculateStreak(user.getId()));
        profile.put("calendarSnaps", getCalendarSnaps(user.getId()));

        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    public ResponseEntity<Void> updateProfile(
            @AuthenticationPrincipal User user,
            @RequestParam(value = "bio", required = false) String bio,
            @RequestParam(value = "profilePic", required = false) MultipartFile profilePic,
            @RequestParam(value = "dailyCaloriesGoal", required = false) Integer calGoal,
            @RequestParam(value = "proteinGoal", required = false) Integer proGoal,
            @RequestParam(value = "carbsGoal", required = false) Integer carbGoal,
            @RequestParam(value = "fatGoal", required = false) Integer fatGoal) throws IOException {

        userService.updateProfile(user, bio, profilePic, calGoal, proGoal, carbGoal, fatGoal);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal User user) {
        userService.deleteAccount(user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal User user) {
        User dbUser = userRepository.findById(user.getId()).orElseThrow();

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", dbUser.getId());
        profile.put("username", dbUser.getUsername());
        profile.put("email", dbUser.getEmail());
        profile.put("bio", dbUser.getBio());
        profile.put("profilePicUrl", dbUser.getProfilePicUrl());
        profile.put("followingCount", followRepository.findByFollowerId(dbUser.getId()).size());
        profile.put("followersCount", followRepository.findByFollowingId(dbUser.getId()).size());

        // Target-uri Macro
        profile.put("dailyCaloriesGoal", dbUser.getDailyCaloriesGoal());
        profile.put("proteinGoal", dbUser.getProteinGoal());
        profile.put("carbsGoal", dbUser.getCarbsGoal());
        profile.put("fatGoal", dbUser.getFatGoal());

        profile.put("streak", calculateStreak(dbUser.getId()));
        profile.put("calendarSnaps", getCalendarSnaps(dbUser.getId()));

        return ResponseEntity.ok(profile);
    }

    private int calculateStreak(UUID userId) {
        List<LocalDate> postDates = postRepository.findTop30ByUserIdAndTypeOrderByCreatedAtDesc(userId, PostType.DAILY)
                .stream().map(p -> p.getCreatedAt().toLocalDate()).distinct().toList();

        if (postDates.isEmpty()) return 0;

        int streak = 0;
        LocalDate checkDate = LocalDate.now();

        if (!postDates.contains(checkDate)) {
            checkDate = checkDate.minusDays(1); // Daca n-a postat azi, inca nu si-a pierdut streak-ul (poate posta pana la 23:59)
        }

        for (LocalDate date : postDates) {
            if (date.equals(checkDate)) {
                streak++;
                checkDate = checkDate.minusDays(1);
            } else {
                break;
            }
        }
        return streak;
    }

    private List<String> getCalendarSnaps(UUID userId) {
        return postRepository.findTop7ByUserIdAndTypeOrderByCreatedAtDesc(userId, PostType.DAILY)
                .stream().map(com.vulse.api.backend.models.Post::getMediaUrl).toList();
    }

    @PatchMapping("/me/picture")
    public ResponseEntity<Map<String, String>> updateProfilePicture(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {

        // Reuse existing method, with null fields
        userService.updateProfile(user, null, file, null, null, null, null);

        // return the new url to front
        User updatedUser = userRepository.findById(user.getId()).orElseThrow();
        Map<String, String> response = new HashMap<>();
        response.put("profilePicUrl", updatedUser.getProfilePicUrl());
        return ResponseEntity.ok(response);
    }
}
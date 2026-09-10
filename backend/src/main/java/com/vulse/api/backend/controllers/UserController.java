package com.vulse.api.backend.controllers;

import com.vulse.api.backend.dtos.user.*;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResponse>> searchUsers(@AuthenticationPrincipal User currentUser, @RequestParam String query) {
        return ResponseEntity.ok(userService.searchUsers(currentUser, query));
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<UserSuggestionResponse>> getSuggestions(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getSuggestions(currentUser));
    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<Void> followUser(@AuthenticationPrincipal User currentUser, @PathVariable UUID userId) {
        userService.followUser(currentUser, userId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/circle")
    public ResponseEntity<List<UserCircleResponse>> getVulseCircle(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getVulseCircle(currentUser));
    }

    @GetMapping("/{username}/profile")
    public ResponseEntity<UserProfileResponse> getProfile(@PathVariable String username, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.getProfile(username, currentUser));
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<List<UserSummaryResponse>> getFollowers(@PathVariable String username) {
        return ResponseEntity.ok(userService.getFollowers(username));
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<List<UserSummaryResponse>> getFollowing(@PathVariable String username) {
        return ResponseEntity.ok(userService.getFollowing(username));
    }

    @GetMapping("/{username}/calendar")
    public ResponseEntity<List<CalendarSnapResponse>> getCalendar(@PathVariable String username) {
        return ResponseEntity.ok(userService.getCalendar(username));
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

    @PutMapping("/me/profile")
    public ResponseEntity<Void> updateProfileDetails(
            @AuthenticationPrincipal User user,
            @RequestBody UpdateProfileRequest request) {
        userService.updateProfileDetails(user, request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> updatePassword(
            @AuthenticationPrincipal User user,
            @RequestBody UpdatePasswordRequest request) {
        userService.updatePassword(user, request);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal User user) {
        userService.deleteAccount(user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<CurrentUserResponse> getCurrentUser(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(userService.getCurrentUser(user));
    }

    @PatchMapping("/me/picture")
    public ResponseEntity<Map<String, String>> updateProfilePicture(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {

        // Reuse existing method, with null fields
        userService.updateProfile(user, null, file, null, null, null, null);

        // return the new url to front
        CurrentUserResponse updatedUser = userService.getCurrentUser(user);
        Map<String, String> response = new HashMap<>();
        response.put("profilePicUrl", updatedUser.getProfilePicUrl());
        return ResponseEntity.ok(response);
    }
}
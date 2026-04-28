package com.vulse.api.backend.controllers;

import com.vulse.api.backend.dtos.post.PostResponse;
import com.vulse.api.backend.models.PostType;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.services.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping("/create")
    public ResponseEntity<PostResponse> createPost(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "frontFile", required = false) MultipartFile frontFile,
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam(value = "calories", required = false) Integer calories,
            @RequestParam(value = "proteinGrams", required = false) Integer proteinGrams,
            @RequestParam(value = "carbsGrams", required = false) Integer carbsGrams,
            @RequestParam(value = "fatGrams", required = false) Integer fatGrams,
            @RequestParam("type") PostType postType) throws IOException {

        return ResponseEntity.ok(postService.createPost(user, file, frontFile, caption, postType, calories, proteinGrams, carbsGrams, fatGrams));
    }

    @PatchMapping("/{postId}/caption")
    public ResponseEntity<PostResponse> updateCaption(
            @PathVariable UUID postId,
            @RequestParam("caption") String newCaption,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(postService.updateCaption(postId, newCaption, user));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable UUID postId,
            @AuthenticationPrincipal User user) {
        postService.deletePost(postId, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/feed")
    public ResponseEntity<Page<PostResponse>> getFeed(
            @AuthenticationPrincipal User user,
            @RequestParam("type") PostType type,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        return ResponseEntity.ok(postService.getFeedByType(user, type, PageRequest.of(page, size)));
    }

    @GetMapping("/my-posts")
    public ResponseEntity<List<PostResponse>> getMyPosts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(postService.getMyPosts(user));
    }
}
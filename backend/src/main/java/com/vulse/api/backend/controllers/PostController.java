package com.vulse.api.backend.controllers;

import com.cloudinary.utils.ObjectUtils;
import com.vulse.api.backend.models.Post;
import com.vulse.api.backend.models.PostType;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.PostRepository;
import com.vulse.api.backend.services.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;
    private final PostRepository postRepository;

    @PostMapping("/create")
    public ResponseEntity<Post> createPost(@AuthenticationPrincipal User user,
                                           @RequestParam("file") MultipartFile file,
                                           @RequestParam("caption") String caption,
                                           @RequestParam("type") PostType postType) throws IOException
    {
        return ResponseEntity.ok(postService.createPost(user,file,caption,postType));
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable UUID postId, @AuthenticationPrincipal User user) {
        postService.deletePost(postId, user);
        return ResponseEntity.ok().build();
    }

    // 2. GET global feed (video short-form)
    // using pageable to optimize stuff
    @GetMapping("/feed")
    public ResponseEntity<Page<Post>> getGlobalFeed(Pageable pageable) {
        return ResponseEntity.ok(postRepository.findAllByOrderByCreatedAtDesc(pageable));
    }

    // 3. GET user history (calendar)
    @GetMapping("/my-posts")
    public ResponseEntity<List<Post>> getMyPosts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(postRepository.findByUserIdOrderByCreatedAtDesc(user.getId()));
    }
}

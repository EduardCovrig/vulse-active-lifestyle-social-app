package com.vulse.api.backend.controllers;

import com.vulse.api.backend.models.Comment;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.services.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    // Body is just a "text" JSON field
    @PostMapping("/{postId}")
    public ResponseEntity<Void> addComment(
            @AuthenticationPrincipal User user,
            @PathVariable UUID postId,
            @RequestBody Map<String, String> body) {
        commentService.addComment(user, postId, body.get("text"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{postId}")
    public ResponseEntity<List<Comment>> getComments(@PathVariable UUID postId) {
        return ResponseEntity.ok(commentService.getCommentsForPost(postId));
    }
}
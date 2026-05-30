package com.vulse.api.backend.controllers;

import com.vulse.api.backend.dtos.comment.CommentResponse;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.services.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
public class CommentController {
    private final CommentService commentService;

    @PostMapping("/{postId}")
    public ResponseEntity<Void> addComment(@AuthenticationPrincipal User user, @PathVariable UUID postId, @RequestBody java.util.Map<String, String> body) {
        commentService.addComment(user, postId, body.get("text"), body.get("parentId"));
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{postId}")
    public ResponseEntity<Page<CommentResponse>> getComments(
            @PathVariable UUID postId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {
        // Limit comments to max 50 per request to prevent memory overload
        return ResponseEntity.ok(commentService.getCommentsForPost(postId, PageRequest.of(page, Math.min(size, 50))));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(@AuthenticationPrincipal User user, @PathVariable UUID commentId) {
        commentService.deleteComment(user, commentId);
        return ResponseEntity.noContent().build();
    }
}
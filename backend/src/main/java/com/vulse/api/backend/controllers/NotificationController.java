package com.vulse.api.backend.controllers;

import com.vulse.api.backend.models.Notification;
import com.vulse.api.backend.models.User;
import com.vulse.api.backend.repositories.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getMyNotifications(@AuthenticationPrincipal User currentUser) {
        List<Map<String, Object>> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(currentUser.getId())
                .stream().map(n -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", n.getId());
                    map.put("type", n.getType().name());
                    map.put("isRead", n.isRead());
                    map.put("createdAt", n.getCreatedAt());

                    Map<String, String> senderMap = new HashMap<>();
                    senderMap.put("id", n.getSender().getId().toString());
                    senderMap.put("username", n.getSender().getRealUsername());
                    senderMap.put("profilePicUrl", n.getSender().getProfilePicUrl());
                    map.put("sender", senderMap);

                    if (n.getPost() != null) {
                        map.put("postId", n.getPost().getId());
                        map.put("postMediaUrl", n.getPost().getMediaUrl());
                    }
                    return map;
                }).collect(Collectors.toList());

        return ResponseEntity.ok(notifs);
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public ResponseEntity<Void> markAsRead(@AuthenticationPrincipal User currentUser, @PathVariable UUID id) {
        Notification notification = notificationRepository.findById(id).orElseThrow();
        if (notification.getRecipient().getId().equals(currentUser.getId())) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
        return ResponseEntity.ok().build();
    }
}
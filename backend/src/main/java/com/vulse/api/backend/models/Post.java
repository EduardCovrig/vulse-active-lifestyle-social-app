package com.vulse.api.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "posts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String mediaUrl; // URL Cloudinary of the pic/video

    private String frontMediaUrl; // Only for daily pic (face pic)

    private Integer calories; //nullable, completed by AI if it's a meal pic

    private String caption;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostType type;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private String mediaPublicId; // Required to delete the file from Cloudinary later

    private String frontMediaPublicId; // For BeReal dual-camera deletion

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
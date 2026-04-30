package com.vulse.api.backend.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "saved_meals")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedMeal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // dirrectly from a post
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post originalPost;

    // or manually
    @Column(nullable = false)
    private Integer calories;
    private Integer proteinGrams;
    private Integer carbsGrams;
    private Integer fatGrams;

    // meal date ( for possible graphs)
    @Column(nullable = false)
    private LocalDate consumedDate;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (consumedDate == null) {
            consumedDate = LocalDate.now();
        }
    }
}
package com.vulse.api.backend.dtos.post;

import com.vulse.api.backend.models.PostType;
import lombok.Builder;

import java.time.LocalDateTime;
<<<<<<< HEAD
=======
import java.util.List;
>>>>>>> main
import java.util.UUID;

@Builder
public record PostResponse(
        UUID id,
        String mediaUrl,
<<<<<<< HEAD
        String frontMediaUrl, // Nullable
        Integer calories,     // Nullable
        String caption,
        PostType type,
        LocalDateTime createdAt,
        PostAuthorDto author
=======
        String frontMediaUrl,
        Integer calories,
        Integer proteinGrams,
        Integer carbsGrams,
        Integer fatGrams,
        String caption,
        PostType type,
        LocalDateTime createdAt,
        PostAuthorDto author,
        boolean isLiked,
        long likesCount,
        long commentsCount,
        List<String> recentReactions
>>>>>>> main
) {
}

package com.vulse.api.backend.dtos.post;

import com.vulse.api.backend.models.PostType;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Builder
public record PostResponse(
        UUID id,
        String mediaUrl,
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
) {
}

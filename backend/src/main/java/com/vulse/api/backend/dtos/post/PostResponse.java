package com.vulse.api.backend.dtos.post;

import com.vulse.api.backend.models.PostType;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

@Builder
public record PostResponse(
        UUID id,
        String mediaUrl,
        String frontMediaUrl, // Nullable
        Integer calories,     // Nullable
        String caption,
        PostType type,
        LocalDateTime createdAt,
        PostAuthorDto author
) {
}

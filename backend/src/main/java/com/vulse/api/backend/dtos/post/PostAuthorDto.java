package com.vulse.api.backend.dtos.post;

import lombok.Builder;

import java.util.UUID;

@Builder
public record PostAuthorDto (
        UUID id,
        String username,
        String profilePicUrl
){
}

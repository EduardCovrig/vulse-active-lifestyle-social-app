package com.vulse.api.backend.dtos;

public record AuthResponse(
        String token,
        String username
) {}

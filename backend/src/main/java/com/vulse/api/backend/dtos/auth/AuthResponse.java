package com.vulse.api.backend.dtos.auth;

public record AuthResponse(
        String token,
        String username
) {}

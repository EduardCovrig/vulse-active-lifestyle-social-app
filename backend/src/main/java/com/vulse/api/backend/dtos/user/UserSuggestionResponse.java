package com.vulse.api.backend.dtos.user;

import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSuggestionResponse {
    private UUID id;
    private String username;
    private String profilePicUrl;
    private Long mutuals;
}

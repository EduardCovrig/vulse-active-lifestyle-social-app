package com.vulse.api.backend.dtos.user;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCircleResponse {
    private UUID id;
    private String name;
    private String img;
    private boolean hasPosted;
    private String dailyPostUrl;
    
    @JsonProperty("isMe")
    private boolean isMe;
}

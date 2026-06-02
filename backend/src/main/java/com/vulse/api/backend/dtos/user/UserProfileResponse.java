package com.vulse.api.backend.dtos.user;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private UUID id;
    private String username;
    private String bio;
    private String profilePicUrl;
    private long followingCount;
    private long followersCount;
    private boolean isFollowing;
    private int streak;
    private List<String> calendarSnaps;
}

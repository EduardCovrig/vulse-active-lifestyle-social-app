package com.vulse.api.backend.dtos.user;

import lombok.*;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentUserResponse {
    private UUID id;
    private String username;
    private String email;
    private String bio;
    private String profilePicUrl;
    private long followingCount;
    private long followersCount;
    private Integer dailyCaloriesGoal;
    private Integer proteinGoal;
    private Integer carbsGoal;
    private Integer fatGoal;
    private int streak;
    private List<String> calendarSnaps;
}

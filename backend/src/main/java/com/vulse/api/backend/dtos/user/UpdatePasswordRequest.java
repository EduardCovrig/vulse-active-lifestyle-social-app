package com.vulse.api.backend.dtos.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePasswordRequest {
    private String oldPassword;
    private String newPassword;
}

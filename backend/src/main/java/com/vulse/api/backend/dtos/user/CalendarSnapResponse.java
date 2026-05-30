package com.vulse.api.backend.dtos.user;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalendarSnapResponse {
    private String date;
    private String mediaUrl;
}

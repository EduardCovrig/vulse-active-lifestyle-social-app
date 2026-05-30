package com.vulse.api.backend.dtos.comment;

import com.vulse.api.backend.dtos.post.PostAuthorDto;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommentResponse {
    private UUID id;
    private PostAuthorDto user;
    private String text;
    private LocalDateTime createdAt;
    private UUID parentId;
}

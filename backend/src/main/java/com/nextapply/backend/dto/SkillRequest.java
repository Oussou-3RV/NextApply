package com.nextapply.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Corps du POST et du PUT /api/skills. Pas de userId : il vient du JWT.
public record SkillRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 100) String category
) {
}

package com.nextapply.backend.dto;

import com.nextapply.backend.model.Skill;

import java.time.Instant;
import java.util.UUID;

public record SkillResponse(
        UUID id,
        String name,
        String category,
        Instant createdAt
) {

    public static SkillResponse from(Skill skill) {
        return new SkillResponse(skill.getId(), skill.getName(), skill.getCategory(), skill.getCreatedAt());
    }
}

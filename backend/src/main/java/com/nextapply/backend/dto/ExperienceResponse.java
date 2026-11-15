package com.nextapply.backend.dto;

import com.nextapply.backend.model.Experience;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ExperienceResponse(
        UUID id,
        String company,
        String title,
        String kind,
        String location,
        LocalDate startDate,
        LocalDate endDate,
        String description,
        boolean relevant,
        Instant createdAt,
        Instant updatedAt
) {

    public static ExperienceResponse from(Experience experience) {
        return new ExperienceResponse(
                experience.getId(),
                experience.getCompany(),
                experience.getTitle(),
                experience.getKind(),
                experience.getLocation(),
                experience.getStartDate(),
                experience.getEndDate(),
                experience.getDescription(),
                experience.isRelevant(),
                experience.getCreatedAt(),
                experience.getUpdatedAt()
        );
    }
}

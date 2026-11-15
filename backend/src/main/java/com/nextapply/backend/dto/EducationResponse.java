package com.nextapply.backend.dto;

import com.nextapply.backend.model.Education;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EducationResponse(
        UUID id,
        String institution,
        String program,
        String level,
        LocalDate startDate,
        LocalDate endDate,
        String description,
        Instant createdAt,
        Instant updatedAt
) {

    public static EducationResponse from(Education education) {
        return new EducationResponse(
                education.getId(),
                education.getInstitution(),
                education.getProgram(),
                education.getLevel(),
                education.getStartDate(),
                education.getEndDate(),
                education.getDescription(),
                education.getCreatedAt(),
                education.getUpdatedAt()
        );
    }
}

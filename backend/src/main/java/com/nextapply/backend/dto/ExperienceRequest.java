package com.nextapply.backend.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

// Corps du POST et du PUT /api/experiences. Pas de userId : il vient du JWT.
public record ExperienceRequest(
        @NotBlank @Size(max = 200) String company,
        @NotBlank @Size(max = 200) String title,
        // Mêmes valeurs que la contrainte chk_experiences_kind ; null = "emploi"
        @Pattern(regexp = "emploi|stage|projet|benevolat",
                message = "doit valoir emploi, stage, projet ou benevolat")
        String kind,
        @Size(max = 200) String location,
        LocalDate startDate,
        LocalDate endDate, // null = en cours
        @Size(max = 4000) String description,
        // Boolean (objet) et non boolean : absent du JSON = null = true par défaut,
        // alors qu'un boolean primitif vaudrait false
        Boolean relevant
) {

    @AssertTrue(message = "la date de fin doit être après la date de début")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}

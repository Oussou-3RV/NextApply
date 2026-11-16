package com.nextapply.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

// Corps du POST et du PUT /api/educations. Pas de userId : il vient du JWT.
public record EducationRequest(
        @NotBlank @Size(max = 200) String institution,
        @NotBlank @Size(max = 200) String program,
        @Size(max = 100) String level,
        LocalDate startDate,
        LocalDate endDate, // null = en cours
        @Size(max = 2000) String description
) {

    // Même règle que la contrainte chk_educations_dates de la base, mais vérifiée
    // avant : on répond 400 avec un message clair au lieu d'une erreur SQL (500)
    // @JsonIgnore : règle de validation seulement, pas un champ à mettre dans le JSON
    // (ces DTO sont aussi renvoyés par POST /api/cv/analyze)
    @JsonIgnore
    @AssertTrue(message = "la date de fin doit être après la date de début")
    public boolean isDateRangeValid() {
        return startDate == null || endDate == null || !endDate.isBefore(startDate);
    }
}

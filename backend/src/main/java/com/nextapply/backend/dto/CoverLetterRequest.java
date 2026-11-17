package com.nextapply.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// PUT /api/offers/{id}/letter : la lettre après mes corrections
public record CoverLetterRequest(@NotNull @Size(max = 10_000) String text) {
}

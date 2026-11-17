package com.nextapply.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

// Corps du PUT /api/offers/{id}/status
public record OfferStatusRequest(
        @NotNull
        @Pattern(regexp = "nouvelle|vue|postulee|masquee",
                message = "doit valoir nouvelle, vue, postulee ou masquee")
        String status
) {
}

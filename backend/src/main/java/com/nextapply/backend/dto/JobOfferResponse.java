package com.nextapply.backend.dto;

import com.nextapply.backend.model.JobOffer;
import com.nextapply.backend.service.ExperienceYears;

import java.time.Instant;
import java.util.UUID;

// Une offre, sans son texte complet (inutile dans les listes).
// experienceFit compare les années exigées aux miennes : inconnu, ok, ecart ou trop.
public record JobOfferResponse(
        UUID id,
        String url,
        String title,
        String company,
        String location,
        Integer experienceMin,
        Integer experienceMax,
        String experienceFit,
        String status,
        Instant appliedAt,
        Instant createdAt
) {

    public static JobOfferResponse from(JobOffer offer, int myExperienceYears) {
        return new JobOfferResponse(
                offer.getId(),
                offer.getUrl(),
                offer.getTitle(),
                offer.getCompany(),
                offer.getLocation(),
                offer.getExperienceMin(),
                offer.getExperienceMax(),
                ExperienceYears.fit(offer.getExperienceMin(), myExperienceYears),
                offer.getStatus(),
                offer.getAppliedAt(),
                offer.getCreatedAt()
        );
    }
}

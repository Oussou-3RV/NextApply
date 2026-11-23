package com.nextapply.backend.dto;

import com.nextapply.backend.model.JobOffer;
import com.nextapply.backend.service.ProfileMatcher;

import java.time.Instant;
import java.util.UUID;

// Une offre, sans son texte complet (inutile dans les listes).
// experienceFit compare les années exigées aux miennes : inconnu, ok, ecart ou trop.
// score : compatibilité sur 100, null tant que les compétences ne sont pas analysées
// (skillsAnalyzed = false, offres ajoutées avant l'étape 5) ou si l'offre n'en cite aucune.
public record JobOfferResponse(
        UUID id,
        String url,
        String title,
        String company,
        String location,
        Integer experienceMin,
        Integer experienceMax,
        String experienceFit,
        Integer score,
        boolean skillsAnalyzed,
        String status,
        Instant appliedAt,
        Instant followedUpAt,
        Instant createdAt
) {

    public static JobOfferResponse from(JobOffer offer, ProfileMatcher matcher) {
        return new JobOfferResponse(
                offer.getId(),
                offer.getUrl(),
                offer.getTitle(),
                offer.getCompany(),
                offer.getLocation(),
                offer.getExperienceMin(),
                offer.getExperienceMax(),
                matcher.experienceFit(offer),
                matcher.match(offer).score(),
                offer.getRequiredSkills() != null,
                offer.getStatus(),
                offer.getAppliedAt(),
                offer.getFollowedUpAt(),
                offer.getCreatedAt()
        );
    }
}

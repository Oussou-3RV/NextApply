package com.nextapply.backend.dto;

import com.nextapply.backend.model.JobOffer;
import com.nextapply.backend.service.ProfileMatcher;

import java.time.Instant;
import java.util.List;

// GET /api/offers/{id} : la fiche d'une offre.
// skillsAnalyzed : false pour une offre ajoutée avant l'étape 5 (bouton « Calculer le score »).
// matchedSkills / missingSkills expliquent le score : « Java et SQL correspondent à ton profil ».
public record OfferDetailResponse(
        JobOfferResponse offer,
        int myExperienceYears,
        boolean skillsAnalyzed,
        List<String> matchedSkills,
        List<String> missingSkills,
        String language,
        String description,
        String coverLetter,
        Instant coverLetterUpdatedAt
) {

    public static OfferDetailResponse from(JobOffer offer, ProfileMatcher matcher) {
        ProfileMatcher.Match match = matcher.match(offer);
        return new OfferDetailResponse(
                JobOfferResponse.from(offer, matcher),
                matcher.myYears(),
                offer.getRequiredSkills() != null,
                match.matched(),
                match.missing(),
                offer.getLanguage(),
                offer.getDescription(),
                offer.getCoverLetter(),
                offer.getCoverLetterUpdatedAt()
        );
    }
}

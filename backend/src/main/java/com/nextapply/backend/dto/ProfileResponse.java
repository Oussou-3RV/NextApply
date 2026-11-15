package com.nextapply.backend.dto;

import com.nextapply.backend.model.Profile;

import java.time.Instant;

// Ce que l'API renvoie : on n'expose jamais l'entité Profile directement
public record ProfileResponse(
        String firstName,
        String lastName,
        String contactEmail,
        String phone,
        String city,
        String region,
        String country,
        String linkedinUrl,
        String githubUrl,
        String portfolioUrl,
        String summary,
        Instant createdAt,
        Instant updatedAt
) {

    public static ProfileResponse from(Profile profile) {
        return new ProfileResponse(
                profile.getFirstName(),
                profile.getLastName(),
                profile.getContactEmail(),
                profile.getPhone(),
                profile.getCity(),
                profile.getRegion(),
                profile.getCountry(),
                profile.getLinkedinUrl(),
                profile.getGithubUrl(),
                profile.getPortfolioUrl(),
                profile.getSummary(),
                profile.getCreatedAt(),
                profile.getUpdatedAt()
        );
    }

    // Profil pas encore enregistré : tous les champs vides
    public static ProfileResponse empty() {
        return new ProfileResponse(null, null, null, null, null, null, null,
                null, null, null, null, null, null);
    }
}

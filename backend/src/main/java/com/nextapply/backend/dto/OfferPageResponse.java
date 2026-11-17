package com.nextapply.backend.dto;

// Ce que l'extension affiche pour la page ouverte.
// created : true si l'offre vient d'être ajoutée, false si elle était déjà connue.
// possibleDuplicate : une autre offre de la même entreprise avec le même titre
// (souvent la même offre publiée sur un autre site), ou null.
public record OfferPageResponse(
        JobOfferResponse offer,
        JobOfferResponse possibleDuplicate,
        boolean created,
        int myExperienceYears
) {
}

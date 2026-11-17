package com.nextapply.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Envoyé par l'extension quand je clique « Ajouter à NextApply ». Pas de userId : il vient du JWT.
public record AddOfferRequest(
        @NotBlank @Size(max = 2000) String url,
        @Size(max = 500) String pageTitle,
        // Le texte visible de la page ; l'extension le coupe déjà à 100 000 caractères
        @NotBlank @Size(max = 100_000) String text
) {
}

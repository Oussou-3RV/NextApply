package com.nextapply.backend.dto;

// Texte brut extrait d'un CV PDF. Rien n'est enregistré : à l'étape 2.2,
// ce texte sera envoyé à l'IA pour proposer un profil à relire.
public record CvTextResponse(int pages, String text) {
}

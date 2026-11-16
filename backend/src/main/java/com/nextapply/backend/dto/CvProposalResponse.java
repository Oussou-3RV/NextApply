package com.nextapply.backend.dto;

import java.util.List;

// Profil proposé par l'IA à partir du CV. Rien n'est enregistré.
// On réutilise exprès les DTO de requête : à l'étape 2.3, l'écran de relecture
// renverra chaque élément, corrigé ou non, aux API existantes (PUT /api/profile,
// POST /api/educations…), qui le valideront comme une saisie à la main.
public record CvProposalResponse(
        ProfileRequest profile,
        List<EducationRequest> educations,
        List<ExperienceRequest> experiences,
        List<SkillRequest> skills
) {
}

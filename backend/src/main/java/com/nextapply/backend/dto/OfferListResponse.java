package com.nextapply.backend.dto;

import java.util.List;

// GET /api/offers : mes offres, et mes années d'expérience pertinente pour les comparer
public record OfferListResponse(int myExperienceYears, List<JobOfferResponse> offers) {
}

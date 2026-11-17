package com.nextapply.backend.service;

import com.nextapply.backend.dto.AddOfferRequest;
import com.nextapply.backend.dto.JobOfferResponse;
import com.nextapply.backend.dto.OfferListResponse;
import com.nextapply.backend.dto.OfferPageResponse;
import com.nextapply.backend.model.JobOffer;
import com.nextapply.backend.repository.ExperienceRepository;
import com.nextapply.backend.repository.JobOfferRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class JobOfferService {

    // On garde le texte de la page pour le score et la lettre (étape 5), dans une limite raisonnable
    static final int MAX_STORED_TEXT = 50_000;

    private final JobOfferRepository jobOfferRepository;
    private final ExperienceRepository experienceRepository;
    private final OfferAnalyzer offerAnalyzer;

    public JobOfferService(JobOfferRepository jobOfferRepository,
                           ExperienceRepository experienceRepository,
                           OfferAnalyzer offerAnalyzer) {
        this.jobOfferRepository = jobOfferRepository;
        this.experienceRepository = experienceRepository;
        this.offerAnalyzer = offerAnalyzer;
    }

    @Transactional(readOnly = true)
    public OfferListResponse list(UUID userId) {
        int myYears = myExperienceYears(userId);
        List<JobOfferResponse> offers = jobOfferRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(o -> JobOfferResponse.from(o, myYears))
                .toList();
        return new OfferListResponse(myYears, offers);
    }

    // L'extension demande si la page ouverte est déjà une de mes offres
    @Transactional(readOnly = true)
    public OfferPageResponse lookup(UUID userId, String url) {
        JobOffer offer = jobOfferRepository.findByUserIdAndUrl(userId, OfferUrls.canonical(url))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cette offre n'est pas encore dans NextApply"));
        int myYears = myExperienceYears(userId);
        return new OfferPageResponse(JobOfferResponse.from(offer, myYears), null, false, myYears);
    }

    @Transactional
    public OfferPageResponse add(UUID userId, AddOfferRequest request) {
        String url = OfferUrls.canonical(request.url());
        int myYears = myExperienceYears(userId);

        // Même adresse : l'offre est déjà là, inutile de payer un appel à l'IA
        var existing = jobOfferRepository.findByUserIdAndUrl(userId, url);
        if (existing.isPresent()) {
            return new OfferPageResponse(JobOfferResponse.from(existing.get(), myYears), null, false, myYears);
        }

        OfferAnalyzer.ExtractedOffer extracted = offerAnalyzer.extract(request.pageTitle(), request.text());
        String text = request.text().strip();
        JobOffer offer = new JobOffer(userId, url, extracted.title(),
                text.length() > MAX_STORED_TEXT ? text.substring(0, MAX_STORED_TEXT) : text);
        offer.setCompany(extracted.company());
        offer.setLocation(extracted.location());
        offer.setExperienceMin(extracted.experienceMin());
        offer.setExperienceMax(extracted.experienceMax());
        JobOffer saved = jobOfferRepository.saveAndFlush(offer);

        JobOfferResponse duplicate = findPossibleDuplicate(userId, saved)
                .map(o -> JobOfferResponse.from(o, myYears))
                .orElse(null);
        return new OfferPageResponse(JobOfferResponse.from(saved, myYears), duplicate, true, myYears);
    }

    @Transactional
    public JobOfferResponse changeStatus(UUID userId, UUID id, String status) {
        JobOffer offer = findOwned(userId, id);
        offer.changeStatus(status, Instant.now());
        return JobOfferResponse.from(jobOfferRepository.saveAndFlush(offer), myExperienceYears(userId));
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        jobOfferRepository.delete(findOwned(userId, id));
    }

    private JobOffer findOwned(UUID userId, UUID id) {
        return jobOfferRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offre introuvable"));
    }

    private int myExperienceYears(UUID userId) {
        return ExperienceYears.of(experienceRepository.findByUserIdOrderByStartDateDesc(userId), LocalDate.now());
    }

    // Même entreprise et même titre, à une autre adresse : sans doute la même offre,
    // publiée sur un autre site. Je n'ai que quelques centaines d'offres : on compare en Java.
    private Optional<JobOffer> findPossibleDuplicate(UUID userId, JobOffer offer) {
        String key = duplicateKey(offer.getCompany(), offer.getTitle());
        if (key == null) {
            return Optional.empty();
        }
        return jobOfferRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(o -> !Objects.equals(o.getId(), offer.getId()))
                .filter(o -> key.equals(duplicateKey(o.getCompany(), o.getTitle())))
                .findFirst();
    }

    // « Développeur Java (H/F) » chez « Acme Inc. » et « developpeur java » chez « ACME »
    // donnent la même clé. Sans entreprise, on ne compare pas (trop de faux doublons).
    static String duplicateKey(String company, String title) {
        String c = simplify(company)
                .replaceAll("\\b(inc|ltd|ltee|limitee|corp|corporation|sa|sas|llc|gmbh)\\b", "")
                .trim();
        String t = simplify(title)
                .replaceAll("\\b(h f|f h|m f|f m|h f x)\\b", "")
                .trim();
        if (c.isEmpty() || t.isEmpty()) {
            return null;
        }
        return c.replaceAll("\\s+", " ") + "|" + t.replaceAll("\\s+", " ");
    }

    private static String simplify(String value) {
        return Normalizer.normalize(Objects.toString(value, ""), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ");
    }
}

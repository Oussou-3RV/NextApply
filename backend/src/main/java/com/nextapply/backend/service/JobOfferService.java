package com.nextapply.backend.service;

import com.nextapply.backend.dto.AddOfferRequest;
import com.nextapply.backend.dto.JobOfferResponse;
import com.nextapply.backend.dto.OfferDetailResponse;
import com.nextapply.backend.dto.OfferListResponse;
import com.nextapply.backend.dto.OfferPageResponse;
import com.nextapply.backend.model.Education;
import com.nextapply.backend.model.Experience;
import com.nextapply.backend.model.JobOffer;
import com.nextapply.backend.model.Profile;
import com.nextapply.backend.model.Skill;
import com.nextapply.backend.repository.EducationRepository;
import com.nextapply.backend.repository.ExperienceRepository;
import com.nextapply.backend.repository.JobOfferRepository;
import com.nextapply.backend.repository.ProfileRepository;
import com.nextapply.backend.repository.SkillRepository;
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

    // On garde le texte de la page pour le score et la lettre, dans une limite raisonnable
    static final int MAX_STORED_TEXT = 50_000;

    private final JobOfferRepository jobOfferRepository;
    private final ProfileRepository profileRepository;
    private final ExperienceRepository experienceRepository;
    private final EducationRepository educationRepository;
    private final SkillRepository skillRepository;
    private final OfferAnalyzer offerAnalyzer;
    private final CoverLetterWriter coverLetterWriter;

    public JobOfferService(JobOfferRepository jobOfferRepository,
                           ProfileRepository profileRepository,
                           ExperienceRepository experienceRepository,
                           EducationRepository educationRepository,
                           SkillRepository skillRepository,
                           OfferAnalyzer offerAnalyzer,
                           CoverLetterWriter coverLetterWriter) {
        this.jobOfferRepository = jobOfferRepository;
        this.profileRepository = profileRepository;
        this.experienceRepository = experienceRepository;
        this.educationRepository = educationRepository;
        this.skillRepository = skillRepository;
        this.offerAnalyzer = offerAnalyzer;
        this.coverLetterWriter = coverLetterWriter;
    }

    @Transactional(readOnly = true)
    public OfferListResponse list(UUID userId) {
        ProfileMatcher matcher = matcher(userId);
        List<JobOfferResponse> offers = jobOfferRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(o -> JobOfferResponse.from(o, matcher))
                .toList();
        return new OfferListResponse(matcher.myYears(), offers);
    }

    @Transactional(readOnly = true)
    public OfferDetailResponse detail(UUID userId, UUID id) {
        return OfferDetailResponse.from(findOwned(userId, id), matcher(userId));
    }

    // L'extension demande si la page ouverte est déjà une de mes offres
    @Transactional(readOnly = true)
    public OfferPageResponse lookup(UUID userId, String url) {
        JobOffer offer = jobOfferRepository.findByUserIdAndUrl(userId, OfferUrls.canonical(url))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cette offre n'est pas encore dans NextApply"));
        ProfileMatcher matcher = matcher(userId);
        return new OfferPageResponse(JobOfferResponse.from(offer, matcher), null, false, matcher.myYears());
    }

    @Transactional
    public OfferPageResponse add(UUID userId, AddOfferRequest request) {
        String url = OfferUrls.canonical(request.url());
        ProfileMatcher matcher = matcher(userId);

        // Même adresse : l'offre est déjà là, inutile de payer un appel à l'IA
        Optional<JobOffer> existing = jobOfferRepository.findByUserIdAndUrl(userId, url);
        if (existing.isPresent()) {
            return new OfferPageResponse(JobOfferResponse.from(existing.get(), matcher), null, false, matcher.myYears());
        }

        OfferAnalyzer.ExtractedOffer extracted = offerAnalyzer.extract(request.pageTitle(), request.text());
        String text = request.text().strip();
        JobOffer offer = new JobOffer(userId, url, extracted.title(),
                text.length() > MAX_STORED_TEXT ? text.substring(0, MAX_STORED_TEXT) : text);
        apply(offer, extracted);
        JobOffer saved = jobOfferRepository.saveAndFlush(offer);

        JobOfferResponse duplicate = findPossibleDuplicate(userId, saved)
                .map(o -> JobOfferResponse.from(o, matcher))
                .orElse(null);
        return new OfferPageResponse(JobOfferResponse.from(saved, matcher), duplicate, true, matcher.myYears());
    }

    // Offres ajoutées avant l'étape 5 : on relit leur texte enregistré pour trouver
    // les compétences demandées (un appel à l'IA), puis le score se calcule tout seul
    @Transactional
    public OfferDetailResponse analyzeSkills(UUID userId, UUID id) {
        JobOffer offer = findOwned(userId, id);
        apply(offer, offerAnalyzer.extract(offer.getTitle(), offer.getDescription()));
        return OfferDetailResponse.from(jobOfferRepository.saveAndFlush(offer), matcher(userId));
    }

    @Transactional
    public OfferDetailResponse writeCoverLetter(UUID userId, UUID id) {
        JobOffer offer = findOwned(userId, id);
        if (offer.getLanguage() == null) {
            // Langue inconnue (offre ajoutée avant l'étape 5) : on l'obtient avec les compétences
            apply(offer, offerAnalyzer.extract(offer.getTitle(), offer.getDescription()));
        }
        Profile profile = profileRepository.findById(userId).orElse(null);
        String letter = coverLetterWriter.write(offer, profile,
                experienceRepository.findByUserIdOrderByStartDateDesc(userId),
                educationRepository.findByUserIdOrderByStartDateDesc(userId),
                skillRepository.findByUserIdOrderByNameAsc(userId));
        offer.changeCoverLetter(letter, Instant.now());
        return OfferDetailResponse.from(jobOfferRepository.saveAndFlush(offer), matcher(userId));
    }

    @Transactional
    public OfferDetailResponse saveCoverLetter(UUID userId, UUID id, String text) {
        JobOffer offer = findOwned(userId, id);
        offer.changeCoverLetter(TextCleaner.clean(text), Instant.now());
        return OfferDetailResponse.from(jobOfferRepository.saveAndFlush(offer), matcher(userId));
    }

    @Transactional
    public JobOfferResponse changeStatus(UUID userId, UUID id, String status) {
        JobOffer offer = findOwned(userId, id);
        offer.changeStatus(status, Instant.now());
        return JobOfferResponse.from(jobOfferRepository.saveAndFlush(offer), matcher(userId));
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        jobOfferRepository.delete(findOwned(userId, id));
    }

    private JobOffer findOwned(UUID userId, UUID id) {
        return jobOfferRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Offre introuvable"));
    }

    private static void apply(JobOffer offer, OfferAnalyzer.ExtractedOffer extracted) {
        offer.setCompany(extracted.company());
        offer.setLocation(extracted.location());
        offer.setExperienceMin(extracted.experienceMin());
        offer.setExperienceMax(extracted.experienceMax());
        offer.setRequiredSkills(extracted.requiredSkills());
        offer.setLanguage(extracted.language());
    }

    // Mon profil, chargé une fois par requête, pour comparer toutes les offres
    private ProfileMatcher matcher(UUID userId) {
        Profile profile = profileRepository.findById(userId).orElse(null);
        List<Skill> skills = skillRepository.findByUserIdOrderByNameAsc(userId);
        List<Experience> experiences = experienceRepository.findByUserIdOrderByStartDateDesc(userId);
        List<Education> educations = educationRepository.findByUserIdOrderByStartDateDesc(userId);
        return new ProfileMatcher(profile, skills, experiences, educations, LocalDate.now());
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

package com.nextapply.backend.service;

import com.nextapply.backend.dto.ProfileRequest;
import com.nextapply.backend.dto.ProfileResponse;
import com.nextapply.backend.model.Profile;
import com.nextapply.backend.repository.ProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static com.nextapply.backend.service.TextCleaner.clean;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;

    // Injection par constructeur : la dépendance est obligatoire et final
    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID userId) {
        return profileRepository.findById(userId)
                .map(ProfileResponse::from)
                .orElseGet(ProfileResponse::empty);
    }

    // PUT = remplacement complet : crée le profil s'il n'existe pas, sinon le met à jour.
    // Un champ absent ou vide dans la requête efface la valeur enregistrée.
    @Transactional
    public ProfileResponse updateProfile(UUID userId, ProfileRequest request) {
        Profile profile = profileRepository.findById(userId)
                .orElseGet(() -> new Profile(userId));

        profile.setFirstName(clean(request.firstName()));
        profile.setLastName(clean(request.lastName()));
        profile.setContactEmail(clean(request.contactEmail()));
        profile.setPhone(clean(request.phone()));
        profile.setCity(clean(request.city()));
        profile.setRegion(clean(request.region()));
        profile.setCountry(clean(request.country()));
        profile.setLinkedinUrl(clean(request.linkedinUrl()));
        profile.setGithubUrl(clean(request.githubUrl()));
        profile.setPortfolioUrl(clean(request.portfolioUrl()));
        profile.setSummary(clean(request.summary()));

        // saveAndFlush : envoie l'INSERT/UPDATE tout de suite, pour que
        // createdAt et updatedAt soient remplis dans la réponse
        Profile saved = profileRepository.saveAndFlush(profile);
        return ProfileResponse.from(saved);
    }
}

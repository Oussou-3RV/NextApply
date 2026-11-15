package com.nextapply.backend.controller;

import com.nextapply.backend.dto.ProfileRequest;
import com.nextapply.backend.dto.ProfileResponse;
import com.nextapply.backend.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ProfileResponse getProfile(@AuthenticationPrincipal Jwt jwt) {
        return profileService.getProfile(userId(jwt));
    }

    // @Valid : Spring vérifie les contraintes du DTO et répond 400 si elles échouent
    @PutMapping
    public ProfileResponse updateProfile(@AuthenticationPrincipal Jwt jwt,
                                         @Valid @RequestBody ProfileRequest request) {
        return profileService.updateProfile(userId(jwt), request);
    }

    // Le userId vient TOUJOURS du jeton (claim sub), jamais du corps de la requête
    private static UUID userId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

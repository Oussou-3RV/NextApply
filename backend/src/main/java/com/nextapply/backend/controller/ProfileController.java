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

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ProfileResponse getProfile(@AuthenticationPrincipal Jwt jwt) {
        return profileService.getProfile(JwtUser.id(jwt));
    }

    // @Valid : Spring vérifie les contraintes du DTO et répond 400 si elles échouent
    @PutMapping
    public ProfileResponse updateProfile(@AuthenticationPrincipal Jwt jwt,
                                         @Valid @RequestBody ProfileRequest request) {
        return profileService.updateProfile(JwtUser.id(jwt), request);
    }
}

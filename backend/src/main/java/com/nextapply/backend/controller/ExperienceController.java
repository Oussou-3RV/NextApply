package com.nextapply.backend.controller;

import com.nextapply.backend.dto.ExperienceRequest;
import com.nextapply.backend.dto.ExperienceResponse;
import com.nextapply.backend.service.ExperienceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/experiences")
public class ExperienceController {

    private final ExperienceService experienceService;

    public ExperienceController(ExperienceService experienceService) {
        this.experienceService = experienceService;
    }

    @GetMapping
    public List<ExperienceResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return experienceService.list(JwtUser.id(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ExperienceResponse create(@AuthenticationPrincipal Jwt jwt,
                                     @Valid @RequestBody ExperienceRequest request) {
        return experienceService.create(JwtUser.id(jwt), request);
    }

    @PutMapping("/{id}")
    public ExperienceResponse update(@AuthenticationPrincipal Jwt jwt,
                                     @PathVariable UUID id,
                                     @Valid @RequestBody ExperienceRequest request) {
        return experienceService.update(JwtUser.id(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        experienceService.delete(JwtUser.id(jwt), id);
    }
}

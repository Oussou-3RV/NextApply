package com.nextapply.backend.controller;

import com.nextapply.backend.dto.EducationRequest;
import com.nextapply.backend.dto.EducationResponse;
import com.nextapply.backend.service.EducationService;
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
@RequestMapping("/api/educations")
public class EducationController {

    private final EducationService educationService;

    public EducationController(EducationService educationService) {
        this.educationService = educationService;
    }

    @GetMapping
    public List<EducationResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return educationService.list(JwtUser.id(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED) // 201 : une ressource a été créée
    public EducationResponse create(@AuthenticationPrincipal Jwt jwt,
                                    @Valid @RequestBody EducationRequest request) {
        return educationService.create(JwtUser.id(jwt), request);
    }

    @PutMapping("/{id}")
    public EducationResponse update(@AuthenticationPrincipal Jwt jwt,
                                    @PathVariable UUID id,
                                    @Valid @RequestBody EducationRequest request) {
        return educationService.update(JwtUser.id(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT) // 204 : supprimé, rien à renvoyer
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        educationService.delete(JwtUser.id(jwt), id);
    }
}

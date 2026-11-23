package com.nextapply.backend.controller;

import com.nextapply.backend.dto.AddOfferRequest;
import com.nextapply.backend.dto.CoverLetterRequest;
import com.nextapply.backend.dto.JobOfferResponse;
import com.nextapply.backend.dto.OfferDetailResponse;
import com.nextapply.backend.dto.OfferListResponse;
import com.nextapply.backend.dto.OfferPageResponse;
import com.nextapply.backend.dto.OfferStatusRequest;
import com.nextapply.backend.service.JobOfferService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/offers")
public class JobOfferController {

    private final JobOfferService jobOfferService;

    public JobOfferController(JobOfferService jobOfferService) {
        this.jobOfferService = jobOfferService;
    }

    @GetMapping
    public OfferListResponse list(@AuthenticationPrincipal Jwt jwt) {
        return jobOfferService.list(JwtUser.id(jwt));
    }

    // GET /api/offers/lookup?url=… : 200 si la page est une offre connue, 404 sinon
    @GetMapping("/lookup")
    public OfferPageResponse lookup(@AuthenticationPrincipal Jwt jwt, @RequestParam String url) {
        return jobOfferService.lookup(JwtUser.id(jwt), url);
    }

    // 201 si l'offre est ajoutée, 200 si elle était déjà là (même adresse)
    @PostMapping
    public ResponseEntity<OfferPageResponse> add(@AuthenticationPrincipal Jwt jwt,
                                                 @Valid @RequestBody AddOfferRequest request) {
        OfferPageResponse response = jobOfferService.add(JwtUser.id(jwt), request);
        return ResponseEntity.status(response.created() ? HttpStatus.CREATED : HttpStatus.OK).body(response);
    }

    // La fiche d'une offre : score expliqué, texte de l'offre, lettre
    @GetMapping("/{id}")
    public OfferDetailResponse detail(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return jobOfferService.detail(JwtUser.id(jwt), id);
    }

    // Relit l'offre avec l'IA pour trouver les compétences demandées (offres d'avant l'étape 5)
    @PostMapping("/{id}/skills")
    public OfferDetailResponse analyzeSkills(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return jobOfferService.analyzeSkills(JwtUser.id(jwt), id);
    }

    // Fait rédiger (ou rédiger de nouveau) la lettre par l'IA
    @PostMapping("/{id}/letter")
    public OfferDetailResponse writeCoverLetter(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return jobOfferService.writeCoverLetter(JwtUser.id(jwt), id);
    }

    // Enregistre la lettre après mes corrections
    @PutMapping("/{id}/letter")
    public OfferDetailResponse saveCoverLetter(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
                                               @Valid @RequestBody CoverLetterRequest request) {
        return jobOfferService.saveCoverLetter(JwtUser.id(jwt), id, request.text());
    }

    @PutMapping("/{id}/status")
    public JobOfferResponse changeStatus(@AuthenticationPrincipal Jwt jwt,
                                         @PathVariable UUID id,
                                         @Valid @RequestBody OfferStatusRequest request) {
        return jobOfferService.changeStatus(JwtUser.id(jwt), id, request.status());
    }

    // Note que j'ai relancé l'employeur pour cette candidature
    @PostMapping("/{id}/follow-up")
    public JobOfferResponse markFollowedUp(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        return jobOfferService.markFollowedUp(JwtUser.id(jwt), id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        jobOfferService.delete(JwtUser.id(jwt), id);
    }
}

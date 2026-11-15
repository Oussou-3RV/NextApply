package com.nextapply.backend.controller;

import com.nextapply.backend.dto.SkillRequest;
import com.nextapply.backend.dto.SkillResponse;
import com.nextapply.backend.service.SkillService;
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
@RequestMapping("/api/skills")
public class SkillController {

    private final SkillService skillService;

    public SkillController(SkillService skillService) {
        this.skillService = skillService;
    }

    @GetMapping
    public List<SkillResponse> list(@AuthenticationPrincipal Jwt jwt) {
        return skillService.list(JwtUser.id(jwt));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SkillResponse create(@AuthenticationPrincipal Jwt jwt,
                                @Valid @RequestBody SkillRequest request) {
        return skillService.create(JwtUser.id(jwt), request);
    }

    @PutMapping("/{id}")
    public SkillResponse update(@AuthenticationPrincipal Jwt jwt,
                                @PathVariable UUID id,
                                @Valid @RequestBody SkillRequest request) {
        return skillService.update(JwtUser.id(jwt), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id) {
        skillService.delete(JwtUser.id(jwt), id);
    }
}

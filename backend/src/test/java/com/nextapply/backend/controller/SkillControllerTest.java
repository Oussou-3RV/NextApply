package com.nextapply.backend.controller;

import com.nextapply.backend.dto.SkillRequest;
import com.nextapply.backend.service.SkillService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Teste le controller et ApiExceptionHandler sans démarrer toute l'application :
// MockMvc simule les requêtes HTTP, le service est un mock
class SkillControllerTest {

    private static final UUID USER_ID = UUID.randomUUID();

    private final SkillService skillService = mock(SkillService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new SkillController(skillService))
                .setControllerAdvice(new ApiExceptionHandler())
                // permet à @AuthenticationPrincipal de recevoir le Jwt
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .build();

        // Simule un utilisateur connecté, comme le ferait le filtre JWT de Spring Security
        Jwt jwt = Jwt.withTokenValue("jeton-de-test")
                .header("alg", "none")
                .subject(USER_ID.toString())
                .build();
        SecurityContextHolder.getContext().setAuthentication(new JwtAuthenticationToken(jwt));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void create_duplicate_returns409WithTheMessage() throws Exception {
        when(skillService.create(eq(USER_ID), any(SkillRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "La compétence « Java » existe déjà"));

        mockMvc.perform(post("/api/skills")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"Java\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("La compétence « Java » existe déjà"));
    }

    @Test
    void create_withBlankName_returns400WithTheInvalidField() throws Exception {
        mockMvc.perform(post("/api/skills")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\": \"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Certains champs sont invalides"))
                .andExpect(jsonPath("$.errors.name").exists());
    }
}

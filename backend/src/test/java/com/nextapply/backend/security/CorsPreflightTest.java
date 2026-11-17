package com.nextapply.backend.security;

import com.nextapply.backend.config.CorsConfig;
import com.nextapply.backend.controller.ProfileController;
import com.nextapply.backend.service.ProfileService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Avant un PUT ou un DELETE avec un jeton, le navigateur envoie une requête OPTIONS
// (« preflight ») SANS jeton. Spring Security doit la laisser passer avec les en-têtes
// CORS, sinon le frontend ne peut pas appeler l'API.
// @WebMvcTest démarre seulement la couche web (pas de base de données).
@WebMvcTest(controllers = ProfileController.class,
        properties = "SUPABASE_URL=http://localhost:9999")
@Import({SecurityConfig.class, CorsConfig.class})
class CorsPreflightTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProfileService profileService;

    @Test
    void preflightFromTheFrontend_isAllowed() throws Exception {
        mockMvc.perform(options("/api/profile")
                        .header("Origin", "http://localhost:5173")
                        .header("Access-Control-Request-Method", "PUT")
                        .header("Access-Control-Request-Headers", "authorization,content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    void requestFromTheChromeExtension_isAllowed() throws Exception {
        // L'extension lit le profil avec un GET : pas de preflight, mais Spring vérifie
        // quand même l'en-tête Origin et répondrait 403 à une origine inconnue
        mockMvc.perform(get("/api/profile")
                        .header("Origin", "chrome-extension://hlaeabgodejnlpdghobbdocknogbkfah"))
                .andExpect(status().isUnauthorized()) // pas de jeton ici : 401, mais pas 403
                .andExpect(header().string("Access-Control-Allow-Origin",
                        "chrome-extension://hlaeabgodejnlpdghobbdocknogbkfah"));
    }

    @Test
    void preflightFromAnotherSite_isRejected() throws Exception {
        mockMvc.perform(options("/api/profile")
                        .header("Origin", "https://site-inconnu.example")
                        .header("Access-Control-Request-Method", "PUT"))
                .andExpect(status().isForbidden());
    }

    @Test
    void requestWithoutToken_isRejectedWith401() throws Exception {
        mockMvc.perform(get("/api/profile"))
                .andExpect(status().isUnauthorized());
    }
}

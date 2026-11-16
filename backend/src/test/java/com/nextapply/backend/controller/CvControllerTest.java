package com.nextapply.backend.controller;

import com.nextapply.backend.dto.CvTextResponse;
import com.nextapply.backend.service.CvTextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Vérifie le branchement HTTP (champ « file », JSON, messages d'erreur).
// L'extraction elle-même est testée dans CvTextExtractorTest.
class CvControllerTest {

    private final CvTextExtractor cvTextExtractor = mock(CvTextExtractor.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new CvController(cvTextExtractor))
                .setControllerAdvice(new ApiExceptionHandler())
                .build();
    }

    private static MockMultipartFile cv(byte[] content) {
        return new MockMultipartFile("file", "cv.pdf", "application/pdf", content);
    }

    @Test
    void extract_returnsThePagesAndTheText() throws Exception {
        when(cvTextExtractor.extract(any())).thenReturn(new CvTextResponse(2, "Camille Tremblay"));

        mockMvc.perform(multipart("/api/cv/extract").file(cv(new byte[]{1})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pages").value(2))
                .andExpect(jsonPath("$.text").value("Camille Tremblay"));
    }

    @Test
    void extract_notAPdf_returns415WithTheMessage() throws Exception {
        when(cvTextExtractor.extract(any())).thenThrow(new ResponseStatusException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Ce fichier n'est pas un PDF. Exporte ton CV en PDF, puis réessaie."));

        mockMvc.perform(multipart("/api/cv/extract").file(cv(new byte[]{1})))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.detail").value("Ce fichier n'est pas un PDF. Exporte ton CV en PDF, puis réessaie."));
    }

    @Test
    void extract_fileTooLarge_returns413InFrench() throws Exception {
        // En vrai, c'est le serveur qui lève cette exception avant le controller
        when(cvTextExtractor.extract(any())).thenThrow(new MaxUploadSizeExceededException(5 * 1024 * 1024));

        mockMvc.perform(multipart("/api/cv/extract").file(cv(new byte[]{1})))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.detail").value(
                        "Le fichier dépasse 5 Mo. Enregistre une version plus légère de ton CV, puis réessaie."));
    }

    @Test
    void extract_withoutFile_returns400() throws Exception {
        mockMvc.perform(multipart("/api/cv/extract"))
                .andExpect(status().isBadRequest());
    }
}

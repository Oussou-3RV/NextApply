package com.nextapply.backend.controller;

import com.nextapply.backend.dto.CvProposalResponse;
import com.nextapply.backend.dto.CvTextResponse;
import com.nextapply.backend.dto.ExperienceRequest;
import com.nextapply.backend.dto.ProfileRequest;
import com.nextapply.backend.dto.SkillRequest;
import com.nextapply.backend.service.CvAnalyzer;
import com.nextapply.backend.service.CvTextExtractor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Vérifie le branchement HTTP (champ « file », JSON, messages d'erreur).
// L'extraction elle-même est testée dans CvTextExtractorTest.
class CvControllerTest {

    private final CvTextExtractor cvTextExtractor = mock(CvTextExtractor.class);
    private final CvAnalyzer cvAnalyzer = mock(CvAnalyzer.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new CvController(cvTextExtractor, cvAnalyzer))
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

    @Test
    void analyze_returnsTheProposalInTheShapeOfTheProfileApis() throws Exception {
        when(cvTextExtractor.extract(any())).thenReturn(new CvTextResponse(1, "texte du CV"));
        when(cvAnalyzer.analyze("texte du CV")).thenReturn(new CvProposalResponse(
                new ProfileRequest("Camille", "Tremblay", null, null, null, null, null, null, null, null, null),
                List.of(),
                List.of(new ExperienceRequest("Acme", "Stagiaire", "stage", null,
                        LocalDate.of(2024, 5, 1), null, null, null)),
                List.of(new SkillRequest("Java", "Langage"))));

        mockMvc.perform(multipart("/api/cv/analyze").file(cv(new byte[]{1})))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.firstName").value("Camille"))
                .andExpect(jsonPath("$.educations").isEmpty())
                .andExpect(jsonPath("$.experiences[0].startDate").value("2024-05-01"))
                // la règle @AssertTrue isDateRangeValid() n'apparaît pas comme un champ
                .andExpect(jsonPath("$.experiences[0].dateRangeValid").doesNotExist())
                .andExpect(jsonPath("$.skills[0].name").value("Java"));
    }

    @Test
    void analyze_notAPdf_neverCallsTheAi() throws Exception {
        when(cvTextExtractor.extract(any())).thenThrow(new ResponseStatusException(
                HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Ce fichier n'est pas un PDF. Exporte ton CV en PDF, puis réessaie."));

        mockMvc.perform(multipart("/api/cv/analyze").file(cv(new byte[]{1})))
                .andExpect(status().isUnsupportedMediaType());
        verify(cvAnalyzer, never()).analyze(any());
    }
}

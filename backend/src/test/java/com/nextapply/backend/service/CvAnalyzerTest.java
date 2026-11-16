package com.nextapply.backend.service;

import com.nextapply.backend.dto.CvProposalResponse;
import com.nextapply.backend.dto.EducationRequest;
import com.nextapply.backend.dto.ExperienceRequest;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// L'IA est simulée : on lui fait renvoyer un JSON choisi et on vérifie le nettoyage
class CvAnalyzerTest {

    private final OpenAiClient openAiClient = mock(OpenAiClient.class);
    private final CvAnalyzer analyzer = new CvAnalyzer(openAiClient, JsonMapper.builder().build());

    private static final String AI_ANSWER = """
            {
              "profile": {
                "firstName": " Camille ", "lastName": "Tremblay", "contactEmail": "camille@example.com",
                "phone": "514 555-0100", "city": "Montréal", "region": "QC", "country": "",
                "linkedinUrl": "linkedin.com/in/camille", "githubUrl": "https://github.com/camille",
                "portfolioUrl": null, "summary": null
              },
              "educations": [
                {"institution": "UQAM", "program": "Baccalauréat en informatique", "level": "Baccalauréat",
                 "startDate": "2023-09-01", "endDate": null, "description": null}
              ],
              "experiences": [
                {"company": "Acme", "title": "Stagiaire développeuse", "kind": "stage", "location": "Montréal",
                 "startDate": "2024-05", "endDate": "2024-08-31", "description": "API Spring Boot"}
              ],
              "skills": [
                {"name": "Java", "category": "Langage"},
                {"name": "java", "category": null},
                {"name": " ", "category": null},
                {"name": "SQL", "category": "Base de données"}
              ]
            }
            """;

    @Test
    void analyze_sendsTheCvTextWithTheSchema() {
        when(openAiClient.completeJson(anyString(), anyString(), anyString(), anyMap())).thenReturn(AI_ANSWER);

        analyzer.analyze("texte du CV");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> schema = ArgumentCaptor.forClass(Map.class);
        verify(openAiClient).completeJson(eq(CvAnalyzer.INSTRUCTIONS), eq("texte du CV"),
                eq(CvAnalyzer.SCHEMA_NAME), schema.capture());
        assertThat(schema.getValue()).containsKeys("type", "properties", "required");
    }

    @Test
    void analyze_cleansTheProposal() {
        when(openAiClient.completeJson(any(), any(), any(), any())).thenReturn(AI_ANSWER);

        CvProposalResponse proposal = analyzer.analyze("texte du CV");

        assertThat(proposal.profile().firstName()).isEqualTo("Camille");
        assertThat(proposal.profile().country()).isNull();
        assertThat(proposal.profile().linkedinUrl()).isEqualTo("https://linkedin.com/in/camille");
        assertThat(proposal.profile().githubUrl()).isEqualTo("https://github.com/camille");

        EducationRequest education = proposal.educations().getFirst();
        assertThat(education.startDate()).isEqualTo(LocalDate.of(2023, 9, 1));
        assertThat(education.endDate()).isNull();

        ExperienceRequest experience = proposal.experiences().getFirst();
        assertThat(experience.kind()).isEqualTo("stage");
        assertThat(experience.startDate()).isNull(); // "2024-05" n'est pas une date complète
        assertThat(experience.endDate()).isEqualTo(LocalDate.of(2024, 8, 31));
        assertThat(experience.relevant()).isNull(); // null = pertinente par défaut

        // Doublon « java » et compétence vide retirés
        assertThat(proposal.skills()).extracting("name").containsExactly("Java", "SQL");
    }

    @Test
    void analyze_unreadableAnswer_failsWith502() {
        when(openAiClient.completeJson(any(), any(), any(), any())).thenReturn("pas du JSON");

        assertThatThrownBy(() -> analyzer.analyze("texte du CV"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY));
    }

    @Test
    void url_addsHttpsOnlyWhenMissing() {
        assertThat(CvAnalyzer.url("github.com/camille")).isEqualTo("https://github.com/camille");
        assertThat(CvAnalyzer.url("http://exemple.ca")).isEqualTo("http://exemple.ca");
        assertThat(CvAnalyzer.url("  ")).isNull();
    }
}

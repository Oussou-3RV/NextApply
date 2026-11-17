package com.nextapply.backend.service;

import com.nextapply.backend.model.Experience;
import com.nextapply.backend.model.JobOffer;
import com.nextapply.backend.model.Profile;
import com.nextapply.backend.model.Skill;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import tools.jackson.databind.json.JsonMapper;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CoverLetterWriterTest {

    private static final UUID USER_ID = UUID.randomUUID();

    private final OpenAiClient openAiClient = mock(OpenAiClient.class);
    private final CoverLetterWriter writer = new CoverLetterWriter(openAiClient, JsonMapper.builder().build());

    private static Profile profile() {
        Profile profile = new Profile(USER_ID);
        profile.setFirstName("Camille");
        profile.setLastName("Tremblay");
        profile.setContactEmail("camille@example.com");
        profile.setPhone("514 555-0100");
        profile.setCity("Montréal");
        profile.setSummary("Étudiante en informatique.");
        return profile;
    }

    @Test
    void neverSendsContactDetails_andSignsWithMyName() {
        when(openAiClient.completeJson(any(), any(), any(), any()))
                .thenReturn("{\"body\": \"Madame, Monsieur,\\n\\nJe postule…\\n\\nCordialement,\"}");
        JobOffer offer = new JobOffer(USER_ID, "https://exemple.ca/1", "Stage Java", "Nous cherchons un stagiaire Java.");
        offer.setLanguage("fr");

        String letter = writer.write(offer, profile(),
                List.of(new Experience(USER_ID, "Acme", "Stagiaire")), List.of(), List.of(new Skill(USER_ID, "Java")));

        ArgumentCaptor<String> prompt = ArgumentCaptor.forClass(String.class);
        verify(openAiClient).completeJson(eq(CoverLetterWriter.INSTRUCTIONS), prompt.capture(),
                eq(CoverLetterWriter.SCHEMA_NAME), anyMap());
        assertThat(prompt.getValue())
                .contains("Stage Java", "Nous cherchons un stagiaire Java.", "Étudiante en informatique.", "Stagiaire, Acme", "Java")
                .doesNotContain("camille@example.com", "514 555-0100", "Montréal", "Camille", "Tremblay");
        assertThat(letter).startsWith("Madame, Monsieur,").endsWith("Cordialement,\n\nCamille Tremblay");
    }
}

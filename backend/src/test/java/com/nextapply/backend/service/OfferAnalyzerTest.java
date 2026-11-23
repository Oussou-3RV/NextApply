package com.nextapply.backend.service;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OfferAnalyzerTest {

    private final OpenAiClient openAiClient = mock(OpenAiClient.class);
    private final OfferAnalyzer analyzer = new OfferAnalyzer(openAiClient, JsonMapper.builder().build());

    private void aiAnswers(String json) {
        when(openAiClient.completeJson(any(), any(), any(), any())).thenReturn(json);
    }

    @Test
    void extract_cleansTheAnswer() {
        aiAnswers("""
                {"isJobOffer": true, "title": " Stage en développement Java ", "company": "Atelier Nord",
                 "location": "Trois-Rivières, hybride", "experienceMin": 0, "experienceMax": 1}""");

        OfferAnalyzer.ExtractedOffer offer = analyzer.extract("Stage Java | Indeed", "texte de l'offre");

        assertThat(offer.title()).isEqualTo("Stage en développement Java");
        assertThat(offer.company()).isEqualTo("Atelier Nord");
        assertThat(offer.experienceMin()).isZero();
        assertThat(offer.experienceMax()).isEqualTo(1);
    }

    @Test
    void extract_sendsTheTabTitleAndAShortenedText() {
        aiAnswers("""
                {"isJobOffer": true, "title": "Dev", "company": null, "location": null,
                 "experienceMin": null, "experienceMax": null}""");

        analyzer.extract("Dev | LinkedIn", "x".repeat(OfferAnalyzer.MAX_TEXT_FOR_AI + 5_000));

        ArgumentCaptor<String> input = ArgumentCaptor.forClass(String.class);
        verify(openAiClient).completeJson(eq(OfferAnalyzer.INSTRUCTIONS), input.capture(),
                eq(OfferAnalyzer.SCHEMA_NAME), anyMap());
        assertThat(input.getValue()).startsWith("Titre de l'onglet : Dev | LinkedIn");
        assertThat(input.getValue().length()).isLessThan(OfferAnalyzer.MAX_TEXT_FOR_AI + 100);
    }

    @Test
    void extract_absurdYearsBecomeUnknown() {
        aiAnswers("""
                {"isJobOffer": true, "title": "Dev", "company": "Acme", "location": null,
                 "experienceMin": 5, "experienceMax": 2}""");
        OfferAnalyzer.ExtractedOffer offer = analyzer.extract(null, "texte");
        assertThat(offer.experienceMin()).isEqualTo(5);
        assertThat(offer.experienceMax()).isNull(); // un maximum plus petit que le minimum est ignoré
    }

    @Test
    void extract_cleansSkillsAndLanguage() {
        aiAnswers("""
                {"isJobOffer": true, "title": "Dev", "company": "Acme", "location": null,
                 "experienceMin": null, "experienceMax": null,
                 "requiredSkills": [" Java ", "java", "", "Spring Boot"], "language": "en"}""");
        OfferAnalyzer.ExtractedOffer offer = analyzer.extract(null, "texte");
        assertThat(offer.requiredSkills()).containsExactly("Java", "Spring Boot");
        assertThat(offer.language()).isEqualTo("en");
    }

    @Test
    void extract_pageThatIsNotAnOffer_isRejectedWith422() {
        aiAnswers("""
                {"isJobOffer": false, "title": "", "company": null, "location": null,
                 "experienceMin": null, "experienceMax": null}""");

        assertThatThrownBy(() -> analyzer.extract("Indeed : emplois", "liste de résultats"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.UNPROCESSABLE_CONTENT));
    }
}

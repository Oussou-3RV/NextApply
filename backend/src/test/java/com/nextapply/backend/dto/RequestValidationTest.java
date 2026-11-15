package com.nextapply.backend.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

// Vérifie les annotations des DTO sans démarrer Spring : c'est ce que fait @Valid dans les controllers
class RequestValidationTest {

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void createValidator() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void closeValidator() {
        factory.close();
    }

    @Test
    void education_endingBeforeItStarts_isInvalid() {
        EducationRequest request = new EducationRequest("Université", "Informatique", null,
                LocalDate.of(2025, 9, 1), LocalDate.of(2024, 6, 1), null);

        Set<ConstraintViolation<EducationRequest>> violations = validator.validate(request);

        assertThat(violations).extracting(v -> v.getPropertyPath().toString())
                .containsExactly("dateRangeValid");
    }

    @Test
    void education_inProgress_isValid() {
        EducationRequest request = new EducationRequest("Université", "Informatique", null,
                LocalDate.of(2025, 9, 1), null, null);

        assertThat(validator.validate(request)).isEmpty();
    }

    @Test
    void experience_withUnknownKind_isInvalid() {
        ExperienceRequest request = new ExperienceRequest("Acme", "Développeur", "freelance",
                null, null, null, null, null);

        assertThat(validator.validate(request)).extracting(v -> v.getPropertyPath().toString())
                .containsExactly("kind");
    }

    @Test
    void skill_withBlankName_isInvalid() {
        assertThat(validator.validate(new SkillRequest("  ", null)))
                .extracting(v -> v.getPropertyPath().toString())
                .containsExactly("name");
    }
}

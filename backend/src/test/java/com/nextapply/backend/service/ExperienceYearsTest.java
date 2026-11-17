package com.nextapply.backend.service;

import com.nextapply.backend.model.Experience;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ExperienceYearsTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 11, 16);

    private static Experience experience(LocalDate start, LocalDate end, boolean relevant) {
        Experience e = new Experience(UUID.randomUUID(), "Acme", "Développeuse");
        e.setStartDate(start);
        e.setEndDate(end);
        e.setRelevant(relevant);
        return e;
    }

    @Test
    void countsOverlappingPeriodsOnlyOnce() {
        // Stage de 2023-01 à 2024-01, et projet de 2023-06 à 2025-01 : 2 ans en tout, pas 2 ans et demi
        List<Experience> list = List.of(
                experience(LocalDate.of(2023, 1, 1), LocalDate.of(2024, 1, 1), true),
                experience(LocalDate.of(2023, 6, 1), LocalDate.of(2025, 1, 1), true));
        assertThat(ExperienceYears.of(list, TODAY)).isEqualTo(2);
    }

    @Test
    void ignoresNonRelevantAndUndatedExperiences_andCountsOngoingUntilToday() {
        List<Experience> list = List.of(
                experience(LocalDate.of(2020, 1, 1), LocalDate.of(2023, 1, 1), false), // serveuse : non pertinente
                experience(null, null, true),
                experience(LocalDate.of(2025, 9, 1), null, true)); // en cours : 1 an et 2 mois
        assertThat(ExperienceYears.of(list, TODAY)).isEqualTo(1);
    }

    @Test
    void fitFollowsTheOneYearToleranceRule() {
        assertThat(ExperienceYears.fit(null, 1)).isEqualTo(ExperienceYears.UNKNOWN);
        assertThat(ExperienceYears.fit(0, 1)).isEqualTo(ExperienceYears.OK);
        assertThat(ExperienceYears.fit(1, 1)).isEqualTo(ExperienceYears.OK);
        assertThat(ExperienceYears.fit(2, 1)).isEqualTo(ExperienceYears.CLOSE);
        assertThat(ExperienceYears.fit(3, 1)).isEqualTo(ExperienceYears.TOO_MUCH);
    }
}

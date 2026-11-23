package com.nextapply.backend.service;

import com.nextapply.backend.model.Experience;
import com.nextapply.backend.model.JobOffer;
import com.nextapply.backend.model.Skill;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ProfileMatcherTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 16);

    private static ProfileMatcher matcher() {
        Experience stage = new Experience(USER_ID, "Acme", "Stagiaire développeuse");
        stage.setStartDate(LocalDate.of(2025, 5, 1));
        stage.setEndDate(null); // en cours : 1 an et demi
        stage.setDescription("API REST avec Spring Boot et PostgreSQL, déploiement avec GitHub Actions.");
        return new ProfileMatcher(null,
                List.of(new Skill(USER_ID, "Java"), new Skill(USER_ID, "C#")),
                List.of(stage), List.of(), TODAY);
    }

    private static JobOffer offer(Integer min, String... skills) {
        JobOffer offer = new JobOffer(USER_ID, "https://exemple.ca/1", "Développeur Java", "texte");
        offer.setExperienceMin(min);
        offer.setRequiredSkills(skills.length == 0 ? null : List.of(skills));
        return offer;
    }

    @Test
    void findsSkillsInTheSkillListAndInTheExperienceText() {
        ProfileMatcher.Match match = matcher().match(offer(0, "Java", "Spring Boot", "PostgreSQL", "Docker"));
        assertThat(match.matched()).containsExactly("Java", "Spring Boot", "PostgreSQL");
        assertThat(match.missing()).containsExactly("Docker");
        // 70 × 3/4 + 30 × 1 = 82,5 → 83
        assertThat(match.score()).isEqualTo(83);
    }

    @Test
    void javaIsNotFoundInJavaScript_andSymbolsAreKept() {
        ProfileMatcher m = matcher();
        assertThat(m.has("JavaScript")).isFalse();
        assertThat(m.has("C#")).isTrue();
        assertThat(m.has("C++")).isFalse();
        assertThat(m.has("postgresql")).isTrue();
    }

    @Test
    void experienceCountsForThirtyPercent() {
        ProfileMatcher m = matcher(); // 1 an d'expérience pertinente
        assertThat(m.match(offer(1, "Java")).score()).isEqualTo(100);
        assertThat(m.match(offer(2, "Java")).score()).isEqualTo(85); // il manque 1 an : la moitié
        assertThat(m.match(offer(3, "Java")).score()).isEqualTo(70); // il manque 2 ans : rien
        assertThat(m.match(offer(null, "Java")).score()).isEqualTo(94); // non précisée : 80 %
    }

    @Test
    void noScoreWhenSkillsAreNotAnalyzed() {
        assertThat(matcher().match(offer(0)).score()).isNull();
    }
}

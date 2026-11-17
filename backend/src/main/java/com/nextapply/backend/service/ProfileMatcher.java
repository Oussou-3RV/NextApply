package com.nextapply.backend.service;

import com.nextapply.backend.model.Education;
import com.nextapply.backend.model.Experience;
import com.nextapply.backend.model.JobOffer;
import com.nextapply.backend.model.Profile;
import com.nextapply.backend.model.Skill;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.regex.Pattern;

// Compare une offre à mon profil, sans IA : le score est stable, l'explication exacte,
// et il se recalcule gratuitement quand mon profil change.
//
// Score sur 100 = 70 % compétences (part des compétences demandées présentes dans mon profil)
//               + 30 % expérience (ok : tout ; non précisée : 80 % ; il manque 1 an : la moitié ; plus : rien)
public final class ProfileMatcher {

    static final double SKILLS_WEIGHT = 0.7;
    static final double EXPERIENCE_WEIGHT = 0.3;

    private final int myYears;
    private final Set<String> mySkills = new HashSet<>();
    // Tout le texte de mon profil (titres, descriptions, résumé…), pour trouver
    // « Docker » mentionné dans un projet même s'il n'est pas dans mes compétences
    private final String profileText;

    public ProfileMatcher(Profile profile, List<Skill> skills, List<Experience> experiences,
                          List<Education> educations, LocalDate today) {
        this.myYears = ExperienceYears.of(experiences, today);
        for (Skill skill : skills) {
            mySkills.add(normalize(skill.getName()));
        }
        List<String> texts = new ArrayList<>();
        if (profile != null) {
            texts.add(profile.getSummary());
        }
        for (Experience e : experiences) {
            texts.add(e.getTitle());
            texts.add(e.getDescription());
        }
        for (Education e : educations) {
            texts.add(e.getProgram());
            texts.add(e.getDescription());
        }
        this.profileText = " " + normalize(String.join(" ", texts.stream().filter(Objects::nonNull).toList())) + " ";
    }

    public int myYears() {
        return myYears;
    }

    public String experienceFit(JobOffer offer) {
        return ExperienceYears.fit(offer.getExperienceMin(), myYears);
    }

    // score null : compétences pas encore analysées, ou l'offre n'en cite aucune
    public record Match(Integer score, List<String> matched, List<String> missing) {
    }

    public Match match(JobOffer offer) {
        List<String> required = offer.getRequiredSkills();
        if (required == null || required.isEmpty()) {
            return new Match(null, List.of(), List.of());
        }
        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        for (String skill : required) {
            (has(skill) ? matched : missing).add(skill);
        }
        double skillsPart = (double) matched.size() / required.size();
        double experiencePart = switch (experienceFit(offer)) {
            case ExperienceYears.OK -> 1.0;
            case ExperienceYears.CLOSE -> 0.5;
            case ExperienceYears.TOO_MUCH -> 0.0;
            default -> 0.8; // l'offre ne dit rien
        };
        int score = (int) Math.round(100 * (SKILLS_WEIGHT * skillsPart + EXPERIENCE_WEIGHT * experiencePart));
        return new Match(score, matched, missing);
    }

    // Présente si c'est une de mes compétences, ou si le mot apparaît dans mon profil.
    // Les limites de mot évitent que « Java » soit trouvé dans « JavaScript ».
    boolean has(String skill) {
        String s = normalize(skill);
        if (s.isEmpty()) {
            return false;
        }
        if (mySkills.contains(s)) {
            return true;
        }
        Pattern word = Pattern.compile("(?<![a-z0-9+#])" + Pattern.quote(s) + "(?![a-z0-9+#])");
        return word.matcher(profileText).find();
    }

    // Minuscules, sans accents ; on garde + # . pour C++, C#, .NET, Node.js
    static String normalize(String value) {
        return Normalizer.normalize(Objects.toString(value, ""), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9+#.]+", " ")
                .trim();
    }
}

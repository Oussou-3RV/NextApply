package com.nextapply.backend.service;

import com.nextapply.backend.model.Experience;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

// Mes années d'expérience pertinente, comparées aux années exigées par une offre.
public final class ExperienceYears {

    // Verdicts renvoyés au frontend et à l'extension
    public static final String UNKNOWN = "inconnu"; // l'offre ne dit rien
    public static final String OK = "ok";           // j'ai le minimum demandé
    public static final String CLOSE = "ecart";     // il me manque 1 an : je peux tenter
    public static final String TOO_MUCH = "trop";   // il manque 2 ans ou plus : offre masquée

    private ExperienceYears() {
    }

    // Années complètes, en ne comptant que les expériences « pertinentes » datées.
    // Les périodes qui se chevauchent (stage pendant un projet) ne comptent qu'une fois.
    public static int of(List<Experience> experiences, LocalDate today) {
        List<LocalDate[]> periods = new ArrayList<>();
        for (Experience e : experiences) {
            if (!e.isRelevant() || e.getStartDate() == null || e.getStartDate().isAfter(today)) {
                continue;
            }
            LocalDate end = e.getEndDate() == null || e.getEndDate().isAfter(today) ? today : e.getEndDate();
            if (!end.isBefore(e.getStartDate())) {
                periods.add(new LocalDate[]{e.getStartDate(), end});
            }
        }
        periods.sort(Comparator.comparing(p -> p[0]));

        long days = 0;
        LocalDate start = null;
        LocalDate end = null;
        for (LocalDate[] p : periods) {
            if (end == null || p[0].isAfter(end)) {
                // Nouvelle période, sans chevauchement avec la précédente
                if (end != null) {
                    days += ChronoUnit.DAYS.between(start, end) + 1;
                }
                start = p[0];
                end = p[1];
            } else if (p[1].isAfter(end)) {
                end = p[1]; // chevauchement : on prolonge la période en cours
            }
        }
        if (end != null) {
            days += ChronoUnit.DAYS.between(start, end) + 1;
        }
        return (int) (days / 365.25);
    }

    // Règle choisie : l'offre est masquée quand elle demande au moins 2 ans de plus que moi
    public static String fit(Integer requiredMin, int myYears) {
        if (requiredMin == null) {
            return UNKNOWN;
        }
        int missing = requiredMin - myYears;
        if (missing <= 0) {
            return OK;
        }
        return missing == 1 ? CLOSE : TOO_MUCH;
    }
}

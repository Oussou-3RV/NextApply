package com.nextapply.backend.service;

// Partagé par les services : les formulaires envoient "" pour un champ vide,
// on enregistre null à la place et on retire les espaces autour du texte.
final class TextCleaner {

    private TextCleaner() {
    }

    static String clean(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

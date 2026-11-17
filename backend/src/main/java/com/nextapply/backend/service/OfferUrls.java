package com.nextapply.backend.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

// Donne une seule adresse à une même offre. Sans ça, la même page ouverte deux fois
// (avec ?utm_source=…, depuis la recherche LinkedIn…) passerait pour deux offres.
public final class OfferUrls {

    // Paramètres de suivi ou de provenance : ils ne changent pas l'offre affichée
    private static final Set<String> TRACKING = Set.of(
            "gclid", "fbclid", "mc_cid", "mc_eid", "trk", "trkinfo", "refid", "trackingid",
            "ref", "referer", "referrer", "src", "source", "from", "gh_src", "lever-source",
            "lever-origin", "tk", "vjs", "advn", "adid");

    private static final Pattern LINKEDIN_VIEW = Pattern.compile("/jobs/view/(?:[^/]*-)?(\\d+)");

    private OfferUrls() {
    }

    public static String canonical(String raw) {
        URI uri;
        try {
            uri = new URI(raw == null ? "" : raw.trim());
        } catch (URISyntaxException e) {
            throw invalid();
        }
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase(Locale.ROOT);
        if (!scheme.equals("http") && !scheme.equals("https") || uri.getHost() == null) {
            throw invalid();
        }
        String host = uri.getHost().toLowerCase(Locale.ROOT);
        Map<String, String> params = parseQuery(uri.getRawQuery());

        // LinkedIn : l'offre s'affiche aussi dans la page de recherche (?currentJobId=…)
        if (host.endsWith("linkedin.com")) {
            Matcher view = LINKEDIN_VIEW.matcher(uri.getPath() == null ? "" : uri.getPath());
            String id = view.find() ? view.group(1) : params.get("currentJobId");
            if (id != null) {
                return "https://www.linkedin.com/jobs/view/" + id + "/";
            }
        }
        // Indeed : l'offre est identifiée par jk (page de l'offre) ou vjk (page de recherche)
        if (host.contains("indeed.")) {
            String key = params.containsKey("jk") ? params.get("jk") : params.get("vjk");
            if (key != null) {
                return "https://" + host + "/viewjob?jk=" + key;
            }
        }

        params.keySet().removeIf(name -> {
            String lower = name.toLowerCase(Locale.ROOT);
            return lower.startsWith("utm_") || TRACKING.contains(lower);
        });

        String path = uri.getRawPath() == null ? "" : uri.getRawPath();
        if (path.endsWith("/")) {
            path = path.substring(0, path.length() - 1);
        }
        String port = uri.getPort() == -1 ? "" : ":" + uri.getPort();
        String query = params.entrySet().stream()
                .map(e -> e.getValue() == null ? e.getKey() : e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("&"));
        // Le fragment (#…) n'est jamais envoyé au serveur : on le retire aussi
        return scheme + "://" + host + port + path + (query.isEmpty() ? "" : "?" + query);
    }

    // Garde l'ordre et l'encodage d'origine des paramètres
    private static Map<String, String> parseQuery(String rawQuery) {
        Map<String, String> params = new LinkedHashMap<>();
        if (rawQuery == null || rawQuery.isEmpty()) {
            return params;
        }
        for (String pair : rawQuery.split("&")) {
            if (pair.isEmpty()) {
                continue;
            }
            int equals = pair.indexOf('=');
            if (equals < 0) {
                params.put(pair, null);
            } else {
                params.put(pair.substring(0, equals), pair.substring(equals + 1));
            }
        }
        return params;
    }

    private static ResponseStatusException invalid() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Adresse de page invalide. Ouvre l'offre dans un onglet, puis réessaie.");
    }
}

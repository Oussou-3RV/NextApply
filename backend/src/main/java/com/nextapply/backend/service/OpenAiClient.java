package com.nextapply.backend.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

// Seul endroit qui parle à l'API d'OpenAI (Chat Completions + Structured Outputs).
// Il ne connaît rien aux CV : il envoie des consignes, un texte et un schéma JSON,
// et renvoie le JSON produit par le modèle. Les erreurs d'OpenAI deviennent des
// messages qui disent quoi faire, comme le reste de l'API.
@Component
public class OpenAiClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiClient.class);

    private final RestClient restClient;
    private final String apiKey;
    private final String url;
    private final String model;

    // RestClient.Builder est fourni par Spring Boot, déjà réglé avec les délais
    // spring.http.clients.* et le convertisseur JSON (Jackson)
    public OpenAiClient(RestClient.Builder restClientBuilder,
                        @Value("${openai.api.key}") String apiKey,
                        @Value("${openai.api.url}") String url,
                        @Value("${openai.model}") String model) {
        this.restClient = restClientBuilder.build();
        this.apiKey = apiKey;
        this.url = url;
        this.model = model;
    }

    public String completeJson(String instructions, String userText, String schemaName, Map<String, Object> schema) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "La clé OpenAI n'est pas configurée. Ajoute la variable d'environnement OPENAI_API_KEY, puis relance le backend.");
        }

        // strict = true : le modèle est obligé de respecter le schéma (champs, types, enum)
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", instructions),
                        Map.of("role", "user", "content", userText)),
                "response_format", Map.of(
                        "type", "json_schema",
                        "json_schema", Map.of("name", schemaName, "strict", true, "schema", schema)));

        ChatCompletion completion;
        try {
            completion = restClient.post()
                    .uri(url)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(ChatCompletion.class);
        } catch (RestClientResponseException e) {
            // On journalise le statut seulement : jamais la clé ni le texte du CV
            log.warn("OpenAI a répondu {}", e.getStatusCode().value());
            throw translate(e.getStatusCode().value());
        } catch (ResourceAccessException e) {
            log.warn("OpenAI injoignable : {}", e.getMessage());
            throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT,
                    "OpenAI ne répond pas. Vérifie ta connexion Internet, puis réessaie.");
        }

        return contentOf(completion);
    }

    private static ResponseStatusException translate(int status) {
        return switch (status) {
            case 401, 403 -> new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "OpenAI a refusé la clé. Vérifie la variable OPENAI_API_KEY, puis relance le backend.");
            case 429 -> new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "OpenAI limite les appels ou ton crédit est épuisé. Réessaie dans une minute, ou vérifie ton compte OpenAI.");
            default -> new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "L'analyse par l'IA a échoué. Réessaie dans un moment.");
        };
    }

    private static String contentOf(ChatCompletion completion) {
        if (completion == null || completion.choices() == null || completion.choices().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OpenAI a renvoyé une réponse vide. Réessaie.");
        }
        Choice choice = completion.choices().getFirst();
        if (choice.message() != null && choice.message().refusal() != null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "L'IA a refusé d'analyser ce document. Vérifie qu'il s'agit bien de ton CV.");
        }
        // "length" : la réponse a été coupée, le JSON serait incomplet
        if ("length".equals(choice.finishReason())) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Le CV est trop long pour être analysé en une fois. Essaie avec une version plus courte.");
        }
        if (choice.message() == null || choice.message().content() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OpenAI a renvoyé une réponse vide. Réessaie.");
        }
        return choice.message().content();
    }

    // Seuls les champs utiles de la réponse d'OpenAI ; les autres sont ignorés
    @JsonIgnoreProperties(ignoreUnknown = true)
    record ChatCompletion(List<Choice> choices) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Choice(Message message, @JsonProperty("finish_reason") String finishReason) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    record Message(String content, String refusal) {
    }
}

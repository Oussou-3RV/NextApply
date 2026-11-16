package com.nextapply.backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.net.SocketTimeoutException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withException;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withTooManyRequests;

// MockRestServiceServer remplace OpenAI : aucun appel réel, aucune clé, aucun coût
class OpenAiClientTest {

    private static final String URL = "https://api.openai.test/v1/chat/completions";
    private static final Map<String, Object> SCHEMA = Map.of("type", "object");

    private RestClient.Builder builder;
    private MockRestServiceServer server;

    @BeforeEach
    void setUp() {
        builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
    }

    private OpenAiClient client(String apiKey) {
        return new OpenAiClient(builder, apiKey, URL, "gpt-4o-mini");
    }

    private String call(OpenAiClient client) {
        return client.completeJson("consignes", "texte du CV", "cv_profile", SCHEMA);
    }

    private static String completion(String message, String finishReason) {
        return """
                {"id": "chatcmpl-1", "choices": [{"index": 0, "message": %s, "finish_reason": "%s"}]}
                """.formatted(message, finishReason);
    }

    @Test
    void completeJson_sendsTheSchemaAndReturnsTheContent() {
        server.expect(requestTo(URL))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer cle-de-test"))
                .andExpect(jsonPath("$.model").value("gpt-4o-mini"))
                .andExpect(jsonPath("$.messages[0].role").value("system"))
                .andExpect(jsonPath("$.messages[1].content").value("texte du CV"))
                .andExpect(jsonPath("$.response_format.json_schema.name").value("cv_profile"))
                .andExpect(jsonPath("$.response_format.json_schema.strict").value(true))
                .andRespond(withSuccess(completion(
                        "{\"role\": \"assistant\", \"content\": \"{\\\"ok\\\": true}\", \"refusal\": null}", "stop"),
                        MediaType.APPLICATION_JSON));

        assertThat(call(client("cle-de-test"))).isEqualTo("{\"ok\": true}");
        server.verify();
    }

    @Test
    void completeJson_withoutKey_failsWith503WithoutCallingOpenAi() {
        assertStatus(client(""), HttpStatus.SERVICE_UNAVAILABLE, "OPENAI_API_KEY");
        server.verify(); // aucune requête attendue, aucune envoyée
    }

    @Test
    void completeJson_rejectedKey_failsWith502() {
        server.expect(requestTo(URL)).andRespond(withStatus(HttpStatus.UNAUTHORIZED));
        assertStatus(client("mauvaise-cle"), HttpStatus.BAD_GATEWAY, "refusé la clé");
    }

    @Test
    void completeJson_rateLimited_failsWith503() {
        server.expect(requestTo(URL)).andRespond(withTooManyRequests());
        assertStatus(client("cle-de-test"), HttpStatus.SERVICE_UNAVAILABLE, "Réessaie dans une minute");
    }

    @Test
    void completeJson_timeout_failsWith504() {
        server.expect(requestTo(URL)).andRespond(withException(new SocketTimeoutException("Read timed out")));
        assertStatus(client("cle-de-test"), HttpStatus.GATEWAY_TIMEOUT, "ne répond pas");
    }

    @Test
    void completeJson_refusal_failsWith502() {
        server.expect(requestTo(URL)).andRespond(withSuccess(completion(
                "{\"role\": \"assistant\", \"content\": null, \"refusal\": \"Je ne peux pas aider.\"}", "stop"),
                MediaType.APPLICATION_JSON));
        assertStatus(client("cle-de-test"), HttpStatus.BAD_GATEWAY, "refusé d'analyser");
    }

    @Test
    void completeJson_truncatedAnswer_failsWith502() {
        server.expect(requestTo(URL)).andRespond(withSuccess(completion(
                "{\"role\": \"assistant\", \"content\": \"{\\\"profile\\\": {\", \"refusal\": null}", "length"),
                MediaType.APPLICATION_JSON));
        assertStatus(client("cle-de-test"), HttpStatus.BAD_GATEWAY, "trop long");
    }

    private void assertStatus(OpenAiClient client, HttpStatus expected, String messagePart) {
        assertThatThrownBy(() -> call(client))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(expected);
                    assertThat(e.getReason()).contains(messagePart);
                });
    }
}

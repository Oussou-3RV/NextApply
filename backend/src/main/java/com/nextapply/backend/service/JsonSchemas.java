package com.nextapply.backend.service;

import org.springframework.core.io.ClassPathResource;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.Map;

// Charge un schéma JSON (Structured Outputs d'OpenAI) rangé dans src/main/resources
final class JsonSchemas {

    private JsonSchemas() {
    }

    static Map<String, Object> load(JsonMapper jsonMapper, String path) {
        try (InputStream in = new ClassPathResource(path).getInputStream()) {
            return jsonMapper.readValue(in, new TypeReference<>() {
            });
        } catch (IOException e) {
            throw new UncheckedIOException("Schéma " + path + " introuvable", e);
        }
    }
}

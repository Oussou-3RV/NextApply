package com.nextapply.backend.controller;

import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

// Le seul endroit où l'on obtient le userId : TOUJOURS depuis le jeton (claim sub),
// jamais depuis le corps de la requête
final class JwtUser {

    private JwtUser() {
    }

    static UUID id(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}

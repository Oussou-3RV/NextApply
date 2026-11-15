package com.nextapply.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

// Corps du PUT /api/profile. Pas de userId ici : il vient toujours du JWT.
// Tous les champs sont facultatifs (le profil se remplit petit à petit).
public record ProfileRequest(
        @Size(max = 100) String firstName,
        @Size(max = 100) String lastName,
        @Email @Size(max = 255) String contactEmail,
        @Size(max = 30) String phone,
        @Size(max = 100) String city,
        @Size(max = 100) String region,
        @Size(max = 100) String country,
        @URL @Size(max = 255) String linkedinUrl,
        @URL @Size(max = 255) String githubUrl,
        @URL @Size(max = 255) String portfolioUrl,
        @Size(max = 2000) String summary
) {
}

package com.nextapply.backend.repository;

import com.nextapply.backend.model.Experience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExperienceRepository extends JpaRepository<Experience, UUID> {

    // Les expériences de l'utilisateur, la plus récente d'abord
    List<Experience> findByUserIdOrderByStartDateDesc(UUID userId);

    Optional<Experience> findByIdAndUserId(UUID id, UUID userId);
}

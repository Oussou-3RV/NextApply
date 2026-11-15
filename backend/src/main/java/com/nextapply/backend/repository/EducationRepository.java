package com.nextapply.backend.repository;

import com.nextapply.backend.model.Education;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EducationRepository extends JpaRepository<Education, UUID> {

    // Les scolarités de l'utilisateur, la plus récente d'abord
    List<Education> findByUserIdOrderByStartDateDesc(UUID userId);

    // Toujours filtrer par userId : on ne lit jamais la scolarité d'un autre utilisateur
    Optional<Education> findByIdAndUserId(UUID id, UUID userId);
}

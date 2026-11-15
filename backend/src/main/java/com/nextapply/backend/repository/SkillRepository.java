package com.nextapply.backend.repository;

import com.nextapply.backend.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SkillRepository extends JpaRepository<Skill, UUID> {

    // Les compétences de l'utilisateur par ordre alphabétique
    List<Skill> findByUserIdOrderByNameAsc(UUID userId);

    Optional<Skill> findByIdAndUserId(UUID id, UUID userId);
}

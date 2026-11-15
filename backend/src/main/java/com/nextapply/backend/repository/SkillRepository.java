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

    // Doublons (sans tenir compte de la casse), comme l'index uq_skills_user_name
    boolean existsByUserIdAndNameIgnoreCase(UUID userId, String name);

    // Pareil, mais en ignorant la compétence qu'on est en train de modifier
    boolean existsByUserIdAndNameIgnoreCaseAndIdNot(UUID userId, String name, UUID id);
}

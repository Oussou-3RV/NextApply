package com.nextapply.backend.repository;

import com.nextapply.backend.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

// La clé du profil est le userId : findById(userId) renvoie le profil de l'utilisateur connecté
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
}

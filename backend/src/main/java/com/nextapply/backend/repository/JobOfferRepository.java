package com.nextapply.backend.repository;

import com.nextapply.backend.model.JobOffer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobOfferRepository extends JpaRepository<JobOffer, UUID> {

    List<JobOffer> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<JobOffer> findByIdAndUserId(UUID id, UUID userId);

    Optional<JobOffer> findByUserIdAndUrl(UUID userId, String url);
}

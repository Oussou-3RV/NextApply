package com.nextapply.backend.service;

import com.nextapply.backend.dto.ExperienceRequest;
import com.nextapply.backend.dto.ExperienceResponse;
import com.nextapply.backend.model.Experience;
import com.nextapply.backend.repository.ExperienceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static com.nextapply.backend.service.TextCleaner.clean;

@Service
public class ExperienceService {

    private final ExperienceRepository experienceRepository;

    public ExperienceService(ExperienceRepository experienceRepository) {
        this.experienceRepository = experienceRepository;
    }

    @Transactional(readOnly = true)
    public List<ExperienceResponse> list(UUID userId) {
        return experienceRepository.findByUserIdOrderByStartDateDesc(userId).stream()
                .map(ExperienceResponse::from)
                .toList();
    }

    @Transactional
    public ExperienceResponse create(UUID userId, ExperienceRequest request) {
        Experience experience = new Experience(userId, clean(request.company()), clean(request.title()));
        apply(experience, request);
        return ExperienceResponse.from(experienceRepository.saveAndFlush(experience));
    }

    @Transactional
    public ExperienceResponse update(UUID userId, UUID id, ExperienceRequest request) {
        Experience experience = findOwned(userId, id);
        experience.setCompany(clean(request.company()));
        experience.setTitle(clean(request.title()));
        apply(experience, request);
        return ExperienceResponse.from(experienceRepository.saveAndFlush(experience));
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        experienceRepository.delete(findOwned(userId, id));
    }

    private Experience findOwned(UUID userId, UUID id) {
        return experienceRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Expérience introuvable"));
    }

    private static void apply(Experience experience, ExperienceRequest request) {
        experience.setKind(request.kind() != null ? request.kind() : "emploi");
        experience.setLocation(clean(request.location()));
        experience.setStartDate(request.startDate());
        experience.setEndDate(request.endDate());
        experience.setDescription(clean(request.description()));
        experience.setRelevant(request.relevant() == null || request.relevant());
    }
}

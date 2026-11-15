package com.nextapply.backend.service;

import com.nextapply.backend.dto.EducationRequest;
import com.nextapply.backend.dto.EducationResponse;
import com.nextapply.backend.model.Education;
import com.nextapply.backend.repository.EducationRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static com.nextapply.backend.service.TextCleaner.clean;

@Service
public class EducationService {

    private final EducationRepository educationRepository;

    public EducationService(EducationRepository educationRepository) {
        this.educationRepository = educationRepository;
    }

    @Transactional(readOnly = true)
    public List<EducationResponse> list(UUID userId) {
        return educationRepository.findByUserIdOrderByStartDateDesc(userId).stream()
                .map(EducationResponse::from)
                .toList();
    }

    @Transactional
    public EducationResponse create(UUID userId, EducationRequest request) {
        Education education = new Education(userId, clean(request.institution()), clean(request.program()));
        apply(education, request);
        return EducationResponse.from(educationRepository.saveAndFlush(education));
    }

    @Transactional
    public EducationResponse update(UUID userId, UUID id, EducationRequest request) {
        Education education = findOwned(userId, id);
        education.setInstitution(clean(request.institution()));
        education.setProgram(clean(request.program()));
        apply(education, request);
        return EducationResponse.from(educationRepository.saveAndFlush(education));
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        educationRepository.delete(findOwned(userId, id));
    }

    // Une scolarité d'un autre utilisateur donne 404, comme si elle n'existait pas :
    // on ne révèle même pas qu'elle existe
    private Education findOwned(UUID userId, UUID id) {
        return educationRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Scolarité introuvable"));
    }

    // Champs facultatifs, communs à la création et à la modification
    private static void apply(Education education, EducationRequest request) {
        education.setLevel(clean(request.level()));
        education.setStartDate(request.startDate());
        education.setEndDate(request.endDate());
        education.setDescription(clean(request.description()));
    }
}

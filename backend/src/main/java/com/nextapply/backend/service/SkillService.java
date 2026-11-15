package com.nextapply.backend.service;

import com.nextapply.backend.dto.SkillRequest;
import com.nextapply.backend.dto.SkillResponse;
import com.nextapply.backend.model.Skill;
import com.nextapply.backend.repository.SkillRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static com.nextapply.backend.service.TextCleaner.clean;

@Service
public class SkillService {

    private final SkillRepository skillRepository;

    public SkillService(SkillRepository skillRepository) {
        this.skillRepository = skillRepository;
    }

    @Transactional(readOnly = true)
    public List<SkillResponse> list(UUID userId) {
        return skillRepository.findByUserIdOrderByNameAsc(userId).stream()
                .map(SkillResponse::from)
                .toList();
    }

    @Transactional
    public SkillResponse create(UUID userId, SkillRequest request) {
        String name = clean(request.name());
        // Vérifié avant l'INSERT : 409 avec un message clair plutôt qu'une erreur SQL (500)
        if (skillRepository.existsByUserIdAndNameIgnoreCase(userId, name)) {
            throw duplicate(name);
        }
        Skill skill = new Skill(userId, name);
        skill.setCategory(clean(request.category()));
        return SkillResponse.from(skillRepository.saveAndFlush(skill));
    }

    @Transactional
    public SkillResponse update(UUID userId, UUID id, SkillRequest request) {
        Skill skill = findOwned(userId, id);
        String name = clean(request.name());
        if (skillRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(userId, name, id)) {
            throw duplicate(name);
        }
        skill.setName(name);
        skill.setCategory(clean(request.category()));
        return SkillResponse.from(skillRepository.saveAndFlush(skill));
    }

    @Transactional
    public void delete(UUID userId, UUID id) {
        skillRepository.delete(findOwned(userId, id));
    }

    private Skill findOwned(UUID userId, UUID id) {
        return skillRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compétence introuvable"));
    }

    private static ResponseStatusException duplicate(String name) {
        return new ResponseStatusException(HttpStatus.CONFLICT, "La compétence « " + name + " » existe déjà");
    }
}

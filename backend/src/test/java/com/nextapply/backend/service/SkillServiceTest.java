package com.nextapply.backend.service;

import com.nextapply.backend.dto.SkillRequest;
import com.nextapply.backend.model.Skill;
import com.nextapply.backend.repository.SkillRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SkillServiceTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final UUID SKILL_ID = UUID.randomUUID();

    @Mock
    private SkillRepository skillRepository;

    @InjectMocks
    private SkillService skillService;

    @Test
    void create_withExistingName_isRejectedWith409() {
        when(skillRepository.existsByUserIdAndNameIgnoreCase(USER_ID, "Java")).thenReturn(true);

        assertThatThrownBy(() -> skillService.create(USER_ID, new SkillRequest(" Java ", null)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
        verify(skillRepository, never()).saveAndFlush(any());
    }

    @Test
    void update_keepingItsOwnName_isAllowed() {
        Skill skill = new Skill(USER_ID, "java");
        when(skillRepository.findByIdAndUserId(SKILL_ID, USER_ID)).thenReturn(Optional.of(skill));
        // la seule compétence "Java" est celle qu'on modifie : pas de doublon
        when(skillRepository.existsByUserIdAndNameIgnoreCaseAndIdNot(USER_ID, "Java", SKILL_ID)).thenReturn(false);
        when(skillRepository.saveAndFlush(skill)).thenReturn(skill);

        assertThat(skillService.update(USER_ID, SKILL_ID, new SkillRequest("Java", "Langage")).name())
                .isEqualTo("Java");
    }

    @Test
    void delete_skillOfAnotherUser_isRejectedWith404() {
        // findByIdAndUserId ne trouve rien : la compétence n'est pas à cet utilisateur
        when(skillRepository.findByIdAndUserId(SKILL_ID, USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> skillService.delete(USER_ID, SKILL_ID))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(skillRepository, never()).delete(any());
    }
}

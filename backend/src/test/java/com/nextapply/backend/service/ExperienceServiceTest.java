package com.nextapply.backend.service;

import com.nextapply.backend.dto.ExperienceRequest;
import com.nextapply.backend.dto.ExperienceResponse;
import com.nextapply.backend.model.Experience;
import com.nextapply.backend.repository.ExperienceRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExperienceServiceTest {

    private static final UUID USER_ID = UUID.randomUUID();

    @Mock
    private ExperienceRepository experienceRepository;

    @InjectMocks
    private ExperienceService experienceService;

    @Test
    void create_withoutKindNorRelevant_usesTheDefaults() {
        when(experienceRepository.saveAndFlush(any(Experience.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        ExperienceRequest request = new ExperienceRequest("Acme", "Développeur", null,
                null, null, null, null, null);

        ExperienceResponse response = experienceService.create(USER_ID, request);

        assertThat(response.kind()).isEqualTo("emploi");
        assertThat(response.relevant()).isTrue();
    }
}

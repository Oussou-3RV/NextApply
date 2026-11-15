package com.nextapply.backend.service;

import com.nextapply.backend.dto.ProfileRequest;
import com.nextapply.backend.dto.ProfileResponse;
import com.nextapply.backend.model.Profile;
import com.nextapply.backend.repository.ProfileRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Test unitaire : le repository est simulé (mock), aucune base de données n'est nécessaire
@ExtendWith(MockitoExtension.class)
class ProfileServiceTest {

    private static final UUID USER_ID = UUID.randomUUID();

    @Mock
    private ProfileRepository profileRepository;

    @InjectMocks
    private ProfileService profileService;

    @BeforeEach
    void saveReturnsTheSameProfile() {
        // lenient : ce comportement n'est pas utilisé par tous les tests
        lenient()
                .when(profileRepository.saveAndFlush(any(Profile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void getProfile_withoutSavedProfile_returnsEmptyProfile() {
        when(profileRepository.findById(USER_ID)).thenReturn(Optional.empty());

        ProfileResponse response = profileService.getProfile(USER_ID);

        assertThat(response).isEqualTo(ProfileResponse.empty());
    }

    @Test
    void updateProfile_withoutSavedProfile_createsItForTheJwtUser() {
        when(profileRepository.findById(USER_ID)).thenReturn(Optional.empty());

        profileService.updateProfile(USER_ID, request("  Alex  ", ""));

        ArgumentCaptor<Profile> saved = ArgumentCaptor.forClass(Profile.class);
        verify(profileRepository).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getUserId()).isEqualTo(USER_ID);
        assertThat(saved.getValue().getFirstName()).isEqualTo("Alex"); // espaces retirés
        assertThat(saved.getValue().getLastName()).isNull();               // "" devient null
    }

    @Test
    void updateProfile_withSavedProfile_replacesAllFields() {
        Profile existing = new Profile(USER_ID);
        existing.setFirstName("Ancien");
        existing.setCity("Montréal");
        when(profileRepository.findById(USER_ID)).thenReturn(Optional.of(existing));

        ProfileResponse response = profileService.updateProfile(USER_ID, request("Nouveau", "Martin"));

        assertThat(response.firstName()).isEqualTo("Nouveau");
        assertThat(response.lastName()).isEqualTo("Martin");
        assertThat(response.city()).isNull(); // absent de la requête : effacé (PUT)
    }

    private static ProfileRequest request(String firstName, String lastName) {
        return new ProfileRequest(firstName, lastName, null, null, null, null,
                null, null, null, null, null);
    }
}

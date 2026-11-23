package com.nextapply.backend.service;

import com.nextapply.backend.dto.AddOfferRequest;
import com.nextapply.backend.dto.OfferPageResponse;
import com.nextapply.backend.model.JobOffer;
import com.nextapply.backend.repository.EducationRepository;
import com.nextapply.backend.repository.ExperienceRepository;
import com.nextapply.backend.repository.JobOfferRepository;
import com.nextapply.backend.repository.ProfileRepository;
import com.nextapply.backend.repository.SkillRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class JobOfferServiceTest {

    private static final UUID USER_ID = UUID.randomUUID();
    private static final String URL = "https://jobs.lever.co/acme/123";

    @Mock
    private JobOfferRepository jobOfferRepository;
    @Mock
    private ProfileRepository profileRepository;
    @Mock
    private ExperienceRepository experienceRepository;
    @Mock
    private EducationRepository educationRepository;
    @Mock
    private SkillRepository skillRepository;
    @Mock
    private OfferAnalyzer offerAnalyzer;
    @Mock
    private CoverLetterWriter coverLetterWriter;

    @InjectMocks
    private JobOfferService service;

    private static JobOffer offer(String url, String company, String title) {
        JobOffer offer = new JobOffer(USER_ID, url, title, "texte");
        offer.setCompany(company);
        ReflectionTestUtils.setField(offer, "id", UUID.randomUUID());
        return offer;
    }

    @Test
    void add_sameAddress_returnsTheKnownOfferWithoutCallingTheAi() {
        when(jobOfferRepository.findByUserIdAndUrl(USER_ID, URL))
                .thenReturn(Optional.of(offer(URL, "Acme", "Développeuse Java")));

        OfferPageResponse response = service.add(USER_ID,
                new AddOfferRequest(URL + "?lever-source=LinkedIn", "Dev", "texte"));

        assertThat(response.created()).isFalse();
        verify(offerAnalyzer, never()).extract(any(), any());
        verify(jobOfferRepository, never()).saveAndFlush(any());
    }

    @Test
    void add_newOffer_isSavedAndFlagsTheSameOfferFromAnotherSite() {
        when(jobOfferRepository.findByUserIdAndUrl(USER_ID, URL)).thenReturn(Optional.empty());
        when(offerAnalyzer.extract("Dev | Lever", "  texte de l'offre  ")).thenReturn(
                new OfferAnalyzer.ExtractedOffer("Développeuse Java (H/F)", "Acme Inc.", "Montréal", 2, null,
                        List.of("Java", "SQL"), "fr"));
        when(jobOfferRepository.saveAndFlush(any(JobOffer.class))).thenAnswer(call -> {
            JobOffer saved = call.getArgument(0);
            ReflectionTestUtils.setField(saved, "id", UUID.randomUUID());
            return saved;
        });
        JobOffer onIndeed = offer("https://ca.indeed.com/viewjob?jk=1", "ACME", "developpeuse java");
        when(jobOfferRepository.findByUserIdOrderByCreatedAtDesc(USER_ID))
                .thenReturn(List.of(offer("https://autre.ca/1", "Acme", "Analyste"), onIndeed));

        OfferPageResponse response = service.add(USER_ID, new AddOfferRequest(URL, "Dev | Lever", "  texte de l'offre  "));

        assertThat(response.created()).isTrue();
        assertThat(response.offer().title()).isEqualTo("Développeuse Java (H/F)");
        assertThat(response.offer().experienceMin()).isEqualTo(2);
        // Aucune compétence ni expérience dans le profil simulé : 0 % compétences, il manque 2 ans
        assertThat(response.offer().score()).isZero();
        assertThat(response.possibleDuplicate().id()).isEqualTo(onIndeed.getId());
    }

    @Test
    void duplicateKey_ignoresCaseAccentsGenderMarksAndCompanySuffixes() {
        assertThat(JobOfferService.duplicateKey("Acme Inc.", "Développeur Java (H/F)"))
                .isEqualTo(JobOfferService.duplicateKey("ACME", "developpeur java"));
        assertThat(JobOfferService.duplicateKey(null, "Développeur Java")).isNull();
    }

    @Test
    void followUp_onlyForAnAppliedOffer_andClearedWhenNoLongerApplied() {
        JobOffer offer = offer(URL, "Acme", "Dev");
        assertThat(offer.markFollowedUp(Instant.now())).isFalse(); // pas encore postulée
        assertThat(offer.getFollowedUpAt()).isNull();

        offer.changeStatus(JobOffer.APPLIED, Instant.parse("2026-11-01T10:00:00Z"));
        assertThat(offer.markFollowedUp(Instant.parse("2026-11-10T10:00:00Z"))).isTrue();
        assertThat(offer.getFollowedUpAt()).isEqualTo(Instant.parse("2026-11-10T10:00:00Z"));

        offer.changeStatus(JobOffer.SEEN, Instant.now());
        assertThat(offer.getFollowedUpAt()).isNull();
    }

    @Test
    void markFollowedUp_onANotAppliedOffer_isRejectedWith409() {
        JobOffer offer = offer(URL, "Acme", "Dev");
        when(jobOfferRepository.findByIdAndUserId(offer.getId(), USER_ID)).thenReturn(Optional.of(offer));

        assertThatThrownBy(() -> service.markFollowedUp(USER_ID, offer.getId()))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void changeStatus_toApplied_setsTheDate_andBackClearsIt() {
        JobOffer offer = offer(URL, "Acme", "Dev");
        offer.changeStatus(JobOffer.APPLIED, Instant.parse("2026-11-16T10:00:00Z"));
        assertThat(offer.getAppliedAt()).isEqualTo(Instant.parse("2026-11-16T10:00:00Z"));

        offer.changeStatus(JobOffer.APPLIED, Instant.parse("2026-11-20T10:00:00Z"));
        assertThat(offer.getAppliedAt()).isEqualTo(Instant.parse("2026-11-16T10:00:00Z")); // date d'origine gardée

        offer.changeStatus(JobOffer.SEEN, Instant.now());
        assertThat(offer.getAppliedAt()).isNull();
    }
}

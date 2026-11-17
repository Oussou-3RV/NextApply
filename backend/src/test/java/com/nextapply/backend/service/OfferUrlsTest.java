package com.nextapply.backend.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OfferUrlsTest {

    @Test
    void removesTrackingParametersFragmentAndTrailingSlash() {
        assertThat(OfferUrls.canonical(
                "https://Jobs.Lever.co/acme/1234-abcd/?lever-source=LinkedIn&utm_source=x#apply"))
                .isEqualTo("https://jobs.lever.co/acme/1234-abcd");
    }

    @Test
    void keepsParametersThatIdentifyTheOffer() {
        assertThat(OfferUrls.canonical("https://www.acme.ca/carrieres?gh_jid=4567&gh_src=abc"))
                .isEqualTo("https://www.acme.ca/carrieres?gh_jid=4567");
    }

    @Test
    void linkedinSearchPageAndOfferPageGiveTheSameAddress() {
        String fromSearch = OfferUrls.canonical(
                "https://www.linkedin.com/jobs/search/?currentJobId=3901234567&keywords=java");
        String fromOffer = OfferUrls.canonical(
                "https://ca.linkedin.com/jobs/view/developpeur-java-at-acme-3901234567?trk=public_jobs");
        assertThat(fromSearch).isEqualTo("https://www.linkedin.com/jobs/view/3901234567/").isEqualTo(fromOffer);
    }

    @Test
    void indeedSearchPageAndOfferPageGiveTheSameAddress() {
        assertThat(OfferUrls.canonical("https://ca.indeed.com/jobs?q=java&l=Montreal&vjk=a1b2c3"))
                .isEqualTo(OfferUrls.canonical("https://ca.indeed.com/viewjob?jk=a1b2c3&from=serp&tk=xyz"))
                .isEqualTo("https://ca.indeed.com/viewjob?jk=a1b2c3");
    }

    @Test
    void rejectsAnAddressThatIsNotAWebPage() {
        assertThatThrownBy(() -> OfferUrls.canonical("chrome://extensions"))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST));
    }
}

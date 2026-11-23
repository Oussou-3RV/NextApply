package com.nextapply.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "job_offers")
public class JobOffer {

    // Valeurs permises par la contrainte chk_job_offers_status
    public static final String NEW = "nouvelle";
    public static final String SEEN = "vue";
    public static final String APPLIED = "postulee";
    public static final String HIDDEN = "masquee";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, updatable = false)
    private UUID userId;

    @Column(nullable = false, updatable = false)
    private String url;

    @Column(nullable = false)
    private String title;

    private String company;
    private String location;
    private Integer experienceMin; // Integer et non int : null = non précisé
    private Integer experienceMax;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String status = NEW;

    private Instant appliedAt;
    private Instant followedUpAt; // dernière relance ; seulement pour une offre postulée

    // Colonne text[] de PostgreSQL : Hibernate la lit et l'écrit comme une liste.
    // null = compétences pas encore analysées (offres ajoutées avant l'étape 5)
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(columnDefinition = "text[]")
    private List<String> requiredSkills;

    private String language; // 'fr' ou 'en'
    private String coverLetter;
    private Instant coverLetterUpdatedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    protected JobOffer() {
    }

    public JobOffer(UUID userId, String url, String title, String description) {
        this.userId = userId;
        this.url = url;
        this.title = title;
        this.description = description;
    }

    // Change le statut en gardant la date de candidature cohérente
    // (même règle que la contrainte chk_job_offers_applied)
    public void changeStatus(String newStatus, Instant now) {
        if (APPLIED.equals(newStatus) && !APPLIED.equals(status)) {
            appliedAt = now;
        } else if (!APPLIED.equals(newStatus)) {
            appliedAt = null;
            followedUpAt = null; // plus de candidature : plus de relance (chk_job_offers_follow_up)
        }
        status = newStatus;
    }

    // Note que j'ai relancé l'employeur. Renvoie false si l'offre n'est pas postulée.
    public boolean markFollowedUp(Instant now) {
        if (!APPLIED.equals(status)) {
            return false;
        }
        followedUpAt = now;
        return true;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getUrl() {
        return url;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCompany() {
        return company;
    }

    public void setCompany(String company) {
        this.company = company;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Integer getExperienceMin() {
        return experienceMin;
    }

    public void setExperienceMin(Integer experienceMin) {
        this.experienceMin = experienceMin;
    }

    public Integer getExperienceMax() {
        return experienceMax;
    }

    public void setExperienceMax(Integer experienceMax) {
        this.experienceMax = experienceMax;
    }

    public String getDescription() {
        return description;
    }

    public String getStatus() {
        return status;
    }

    public Instant getAppliedAt() {
        return appliedAt;
    }

    public Instant getFollowedUpAt() {
        return followedUpAt;
    }

    public List<String> getRequiredSkills() {
        return requiredSkills;
    }

    public void setRequiredSkills(List<String> requiredSkills) {
        this.requiredSkills = requiredSkills;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getCoverLetter() {
        return coverLetter;
    }

    public Instant getCoverLetterUpdatedAt() {
        return coverLetterUpdatedAt;
    }

    public void changeCoverLetter(String coverLetter, Instant now) {
        this.coverLetter = coverLetter;
        this.coverLetterUpdatedAt = now;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

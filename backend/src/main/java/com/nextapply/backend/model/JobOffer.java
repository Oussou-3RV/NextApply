package com.nextapply.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
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
        }
        status = newStatus;
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

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}

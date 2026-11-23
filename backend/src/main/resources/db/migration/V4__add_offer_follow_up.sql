-- Étape 6 : date de la dernière relance d'une candidature
alter table job_offers
    add column followed_up_at timestamptz;

-- On ne relance qu'une candidature envoyée
alter table job_offers
    add constraint chk_job_offers_follow_up check (followed_up_at is null or applied_at is not null);

-- Étape 5 : score expliqué et lettre de motivation
alter table job_offers
    add column required_skills text[],            -- compétences demandées ; null = pas encore analysées
    add column language text,                     -- langue de l'offre, pour la lettre : 'fr' ou 'en'
    add column cover_letter text,                 -- lettre rédigée par l'IA, puis relue et modifiée par moi
    add column cover_letter_updated_at timestamptz;

alter table job_offers
    add constraint chk_job_offers_language check (language is null or language in ('fr', 'en'));

-- Offres d'emploi ajoutées depuis l'extension Chrome (étape 4)
create table job_offers (
    id             uuid primary key default gen_random_uuid(),
    user_id        uuid not null references auth.users (id) on delete cascade,
    url            text not null,      -- adresse nettoyée (sans paramètres de suivi)
    title          text not null,
    company        text,
    location       text,
    experience_min integer,            -- années exigées ; null = non précisé
    experience_max integer,
    description    text not null,      -- texte de la page, pour le score et la lettre (étape 5)
    status         text not null default 'nouvelle',
    applied_at     timestamptz,        -- rempli seulement quand le statut est « postulee »
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    constraint chk_job_offers_status
        check (status in ('nouvelle', 'vue', 'postulee', 'masquee')),
    constraint chk_job_offers_applied
        check ((status = 'postulee') = (applied_at is not null)),
    constraint chk_job_offers_experience
        check ((experience_min is null or experience_min >= 0)
           and (experience_max is null or experience_min is null or experience_max >= experience_min))
);

-- Même adresse = même offre : on ne peut pas l'ajouter deux fois
create unique index uq_job_offers_user_url on job_offers (user_id, url);
create index idx_job_offers_user_created on job_offers (user_id, created_at desc);

-- RLS activé sans règle, comme les autres tables : seul le backend y accède
alter table job_offers enable row level security;

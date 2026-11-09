create table profiles (
    user_id        uuid primary key references auth.users (id) on delete cascade,
    first_name     text,
    last_name      text,
    contact_email  text,
    phone          text,
    city           text,
    region         text,
    country        text,
    linkedin_url   text,
    github_url     text,
    portfolio_url  text,
    summary        text,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

create table educations (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    institution text not null,
    program     text not null,
    level       text,
    start_date  date,
    end_date    date,                 -- null = en cours
    description text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    constraint chk_educations_dates
        check (end_date is null or start_date is null or end_date >= start_date)
);
create index idx_educations_user_id on educations (user_id);

create table experiences (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users (id) on delete cascade,
    company     text not null,
    title       text not null,
    kind        text not null default 'emploi',
    location    text,
    start_date  date,
    end_date    date,                 -- null = en cours
    description text,
    is_relevant boolean not null default true,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    constraint chk_experiences_kind
        check (kind in ('emploi', 'stage', 'projet', 'benevolat')),
    constraint chk_experiences_dates
        check (end_date is null or start_date is null or end_date >= start_date)
);
create index idx_experiences_user_id on experiences (user_id);

create table skills (
    id         uuid primary key default gen_random_uuid(),
    user_id    uuid not null references auth.users (id) on delete cascade,
    name       text not null,
    category   text,
    created_at timestamptz not null default now()
);
create unique index uq_skills_user_name on skills (user_id, lower(name));

-- RLS activé sans règle : aucun accès via l'API publique de Supabase
alter table profiles    enable row level security;
alter table educations  enable row level security;
alter table experiences enable row level security;
alter table skills      enable row level security;
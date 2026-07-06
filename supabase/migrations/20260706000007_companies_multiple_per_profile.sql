-- BizClub — Migration 7 : un membre peut avoir plusieurs entreprises
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-06.

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  role_title text,        -- ex. Fondateur, Gérante, Associé
  bce_number text,        -- numéro BCE (Banque-Carrefour des Entreprises)
  website_url text,
  city text,
  description text,
  created_at timestamptz not null default now()
);

create index companies_owner_idx on public.companies (owner_id);

alter table public.companies enable row level security;

create policy "Entreprises visibles par les membres"
  on public.companies for select
  to authenticated
  using (owner_id = (select auth.uid()) or public.is_approved_member((select auth.uid())));

create policy "Gérer ses propres entreprises"
  on public.companies for all
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Reprise des données existantes puis suppression de l'ancien champ unique
insert into public.companies (owner_id, name)
select id, company_name
from public.profiles
where company_name is not null and length(trim(company_name)) > 0;

alter table public.profiles drop column company_name;

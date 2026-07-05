-- BizClub — Migration 1 : fondations (profils, régions, secteurs)
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-05.

-- Tables de référence : régions et secteurs (structurés dès le départ pour
-- permettre la segmentation du networking par région / secteur)
create table public.regions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  country text not null default 'FR',
  created_at timestamptz not null default now()
);

create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

-- Statut d'adhésion (validation des candidatures)
create type public.membership_status as enum ('pending', 'approved', 'rejected', 'suspended');

-- Profil entrepreneur, lié à auth.users
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  headline text,
  bio text,
  company_name text,
  avatar_url text,
  website_url text,
  linkedin_url text,
  city text,
  status public.membership_status not null default 'pending',
  role text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un membre peut appartenir à plusieurs régions / secteurs
create table public.profile_regions (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  region_id uuid not null references public.regions (id) on delete cascade,
  primary key (profile_id, region_id)
);

create table public.profile_sectors (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  sector_id uuid not null references public.sectors (id) on delete cascade,
  primary key (profile_id, sector_id)
);

-- Fonctions utilitaires
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- security definer pour éviter la récursion dans les policies RLS
create function public.is_approved_member(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and status = 'approved'
  );
$$;

create function public.is_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('moderator', 'admin')
  );
$$;

-- Création automatique du profil à l'inscription
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.regions enable row level security;
alter table public.sectors enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_regions enable row level security;
alter table public.profile_sectors enable row level security;

create policy "Référentiels lisibles par tous"
  on public.regions for select
  to authenticated, anon
  using (true);

create policy "Référentiels lisibles par tous"
  on public.sectors for select
  to authenticated, anon
  using (true);

create policy "Voir son profil ou les profils publics approuvés"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or public.is_staff((select auth.uid()))
    or (status = 'approved' and is_public and public.is_approved_member((select auth.uid())))
  );

create policy "Modifier son propre profil"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = 'member' and status = (select p.status from public.profiles p where p.id = (select auth.uid())));

create policy "Le staff peut modérer les profils"
  on public.profiles for update
  to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy "Voir les régions des profils visibles"
  on public.profile_regions for select
  to authenticated
  using (public.is_approved_member((select auth.uid())) or profile_id = (select auth.uid()));

create policy "Gérer ses propres régions"
  on public.profile_regions for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "Voir les secteurs des profils visibles"
  on public.profile_sectors for select
  to authenticated
  using (public.is_approved_member((select auth.uid())) or profile_id = (select auth.uid()));

create policy "Gérer ses propres secteurs"
  on public.profile_sectors for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

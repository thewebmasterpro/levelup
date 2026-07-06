-- LevelUpNow — Migration 10 : Phase 2 (événements, ressources, besoins/offres, SOS, Q&R, badge BCE)
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-06.

-- ============ Événements ============
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  is_online boolean not null default false,
  starts_at timestamptz not null,
  ends_at timestamptz,
  capacity int,
  chapter_id uuid references public.chapters (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index events_starts_idx on public.events (starts_at);

create table public.event_registrations (
  event_id uuid not null references public.events (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  registered_at timestamptz not null default now(),
  primary key (event_id, profile_id)
);

alter table public.events enable row level security;
alter table public.event_registrations enable row level security;

create policy "Événements visibles par les membres"
  on public.events for select
  to authenticated
  using (public.is_approved_member((select auth.uid())));

create policy "Le staff gère les événements"
  on public.events for all
  to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy "Inscriptions visibles par les membres"
  on public.event_registrations for select
  to authenticated
  using (public.is_approved_member((select auth.uid())));

create policy "S'inscrire à un événement"
  on public.event_registrations for insert
  to authenticated
  with check (profile_id = (select auth.uid()) and public.is_approved_member((select auth.uid())));

create policy "Se désinscrire"
  on public.event_registrations for delete
  to authenticated
  using (profile_id = (select auth.uid()));

-- ============ Ressources ============
insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do nothing;

create policy "Ressources publiques en lecture"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'resources');

create policy "Déposer une ressource dans son dossier"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  url text,
  file_path text,
  category text not null default 'autre',
  submitted_by uuid references public.profiles (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.resources enable row level security;

create policy "Ressources approuvées visibles par les membres"
  on public.resources for select
  to authenticated
  using (
    (status = 'approved' and public.is_approved_member((select auth.uid())))
    or submitted_by = (select auth.uid())
    or public.is_staff((select auth.uid()))
  );

create policy "Proposer une ressource"
  on public.resources for insert
  to authenticated
  with check (
    submitted_by = (select auth.uid())
    and public.is_approved_member((select auth.uid()))
    and (status = 'pending' or public.is_staff((select auth.uid())))
  );

create policy "Le staff modère les ressources"
  on public.resources for update
  to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy "Supprimer sa ressource ou modérer"
  on public.resources for delete
  to authenticated
  using (submitted_by = (select auth.uid()) or public.is_staff((select auth.uid())));

-- ============ Besoins & Offres ============
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('need', 'offer')),
  title text not null,
  description text,
  sector_id uuid references public.sectors (id) on delete set null,
  region_id uuid references public.regions (id) on delete set null,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz not null default now()
);

create index listings_status_idx on public.listings (status, created_at desc);

alter table public.listings enable row level security;

create policy "Annonces visibles par les membres"
  on public.listings for select
  to authenticated
  using (public.is_approved_member((select auth.uid())));

create policy "Publier une annonce"
  on public.listings for insert
  to authenticated
  with check (author_id = (select auth.uid()) and public.is_approved_member((select auth.uid())));

create policy "Gérer ses annonces"
  on public.listings for update
  to authenticated
  using (author_id = (select auth.uid()) or public.is_staff((select auth.uid())))
  with check (author_id = (select auth.uid()) or public.is_staff((select auth.uid())));

create policy "Supprimer ses annonces ou modérer"
  on public.listings for delete
  to authenticated
  using (author_id = (select auth.uid()) or public.is_staff((select auth.uid())));

-- Matching : notifier les membres du secteur concerné
create function public.handle_listing_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.sector_id is not null then
    insert into public.notifications (recipient_id, kind, message, link)
    select
      ps.profile_id,
      'listing_match',
      case when new.kind = 'need'
        then '🔎 Nouveau besoin dans votre secteur : '
        else '💡 Nouvelle offre dans votre secteur : '
      end || new.title,
      '/espace/annonces'
    from public.profile_sectors ps
    join public.profiles p on p.id = ps.profile_id
    where ps.sector_id = new.sector_id
      and ps.profile_id <> new.author_id
      and p.status = 'approved';
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_listing_insert() from public, anon, authenticated;

create trigger listings_notify_insert
  after insert on public.listings
  for each row execute function public.handle_listing_insert();

-- ============ Q&R et SOS sur les publications ============
alter table public.posts add column kind text not null default 'post'
  check (kind in ('post', 'question', 'sos'));
alter table public.posts add column best_comment_id uuid references public.comments (id) on delete set null;

create index posts_content_fts on public.posts using gin (to_tsvector('french', content));

-- SOS : alerter toute la communauté
create function public.handle_post_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare author_name text;
begin
  if new.kind = 'sos' then
    select full_name into author_name from public.profiles where id = new.author_id;
    insert into public.notifications (recipient_id, kind, message, link)
    select id, 'sos',
      '🆘 SOS de ' || coalesce(author_name, 'un membre') || ' — il a besoin d''aide rapidement !',
      '/espace'
    from public.profiles
    where status = 'approved' and id <> new.author_id;
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_post_insert() from public, anon, authenticated;

create trigger posts_notify_sos
  after insert on public.posts
  for each row execute function public.handle_post_insert();

-- ============ Badge entreprise vérifiée (n° BCE) ============
alter table public.companies add column bce_verified boolean not null default false;

create policy "Le staff vérifie les entreprises"
  on public.companies for update
  to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create function public.protect_company_verified()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.bce_verified
       and (select auth.uid()) is not null
       and not public.is_staff((select auth.uid())) then
      new.bce_verified := false;
    end if;
  elsif new.bce_verified is distinct from old.bce_verified
     and (select auth.uid()) is not null
     and not public.is_staff((select auth.uid())) then
    raise exception 'La vérification BCE est réservée aux administrateurs';
  end if;
  return new;
end;
$$;
revoke execute on function public.protect_company_verified() from public, anon, authenticated;

create trigger companies_protect_verified
  before insert or update on public.companies
  for each row execute function public.protect_company_verified();

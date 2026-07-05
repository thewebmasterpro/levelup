-- BizClub — Migration 2 : chapitres, mises en relation, publications, messagerie
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-05.

-- Chapitres : espaces de discussion typés (thématique, région, secteur).
-- C'est ce qui permettra de régionaliser / sectoriser le networking sans refonte.
create type public.chapter_type as enum ('thematic', 'region', 'sector');

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  type public.chapter_type not null default 'thematic',
  slug text not null unique,
  name text not null,
  description text,
  region_id uuid references public.regions (id) on delete set null,
  sector_id uuid references public.sectors (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint chapter_type_target check (
    (type = 'region' and region_id is not null and sector_id is null)
    or (type = 'sector' and sector_id is not null and region_id is null)
    or (type = 'thematic' and region_id is null and sector_id is null)
  )
);

create table public.chapter_members (
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'animator')),
  joined_at timestamptz not null default now(),
  primary key (chapter_id, profile_id)
);

-- Mises en relation (networking)
create type public.connection_status as enum ('pending', 'accepted', 'declined');

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  addressee_id uuid not null references public.profiles (id) on delete cascade,
  message text,
  status public.connection_status not null default 'pending',
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

-- Publications (fil général si chapter_id est null, sinon fil du chapitre)
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete cascade,
  title text,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'like' check (kind in ('like', 'insightful', 'support', 'celebrate')),
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

-- Messagerie privée (1-à-1 et groupe)
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  title text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at);
create index posts_chapter_created_idx on public.posts (chapter_id, created_at desc);
create index comments_post_idx on public.comments (post_id, created_at);
create index connections_addressee_idx on public.connections (addressee_id, status);

-- security definer pour éviter la récursion RLS sur les participants
create function public.is_conversation_participant(conv uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.conversation_participants
    where conversation_id = conv and profile_id = uid
  );
$$;

-- RLS
alter table public.chapters enable row level security;
alter table public.chapter_members enable row level security;
alter table public.connections enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Chapitres : visibles par les membres approuvés ; créés par le staff (MVP)
create policy "Chapitres visibles par les membres"
  on public.chapters for select
  to authenticated
  using (public.is_approved_member((select auth.uid())));

create policy "Le staff gère les chapitres"
  on public.chapters for all
  to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

create policy "Adhésions aux chapitres visibles par les membres"
  on public.chapter_members for select
  to authenticated
  using (public.is_approved_member((select auth.uid())));

create policy "Rejoindre / quitter un chapitre"
  on public.chapter_members for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and public.is_approved_member((select auth.uid())));

-- Mises en relation : visibles et gérées par les deux parties
create policy "Voir ses mises en relation"
  on public.connections for select
  to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

create policy "Demander une mise en relation"
  on public.connections for insert
  to authenticated
  with check (requester_id = (select auth.uid()) and public.is_approved_member((select auth.uid())));

create policy "Répondre à une demande reçue"
  on public.connections for update
  to authenticated
  using (addressee_id = (select auth.uid()))
  with check (addressee_id = (select auth.uid()));

create policy "Annuler une demande envoyée"
  on public.connections for delete
  to authenticated
  using (requester_id = (select auth.uid()));

-- Publications
create policy "Publications visibles par les membres"
  on public.posts for select
  to authenticated
  using (public.is_approved_member((select auth.uid())));

create policy "Publier en tant que membre approuvé"
  on public.posts for insert
  to authenticated
  with check (
    author_id = (select auth.uid())
    and public.is_approved_member((select auth.uid()))
    and (
      chapter_id is null
      or exists (
        select 1 from public.chapter_members cm
        where cm.chapter_id = posts.chapter_id and cm.profile_id = (select auth.uid())
      )
    )
  );

create policy "Modifier ses publications"
  on public.posts for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

create policy "Supprimer ses publications ou modérer"
  on public.posts for delete
  to authenticated
  using (author_id = (select auth.uid()) or public.is_staff((select auth.uid())));

-- Commentaires
create policy "Commentaires visibles par les membres"
  on public.comments for select
  to authenticated
  using (public.is_approved_member((select auth.uid())));

create policy "Commenter en tant que membre approuvé"
  on public.comments for insert
  to authenticated
  with check (author_id = (select auth.uid()) and public.is_approved_member((select auth.uid())));

create policy "Supprimer ses commentaires ou modérer"
  on public.comments for delete
  to authenticated
  using (author_id = (select auth.uid()) or public.is_staff((select auth.uid())));

-- Réactions
create policy "Réactions visibles par les membres"
  on public.reactions for select
  to authenticated
  using (public.is_approved_member((select auth.uid())));

create policy "Gérer ses réactions"
  on public.reactions for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and public.is_approved_member((select auth.uid())));

-- Messagerie : réservée aux participants
create policy "Voir ses conversations"
  on public.conversations for select
  to authenticated
  using (public.is_conversation_participant(id, (select auth.uid())));

create policy "Créer une conversation"
  on public.conversations for insert
  to authenticated
  with check (created_by = (select auth.uid()) and public.is_approved_member((select auth.uid())));

create policy "Voir les participants de ses conversations"
  on public.conversation_participants for select
  to authenticated
  using (public.is_conversation_participant(conversation_id, (select auth.uid())));

create policy "Ajouter des participants à sa conversation"
  on public.conversation_participants for insert
  to authenticated
  with check (
    public.is_approved_member((select auth.uid()))
    and (
      profile_id = (select auth.uid())
      or exists (
        select 1 from public.conversations c
        where c.id = conversation_id and c.created_by = (select auth.uid())
      )
    )
  );

create policy "Quitter une conversation"
  on public.conversation_participants for delete
  to authenticated
  using (profile_id = (select auth.uid()));

create policy "Mettre à jour son statut de lecture"
  on public.conversation_participants for update
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "Lire les messages de ses conversations"
  on public.messages for select
  to authenticated
  using (public.is_conversation_participant(conversation_id, (select auth.uid())));

create policy "Envoyer un message dans ses conversations"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and public.is_conversation_participant(conversation_id, (select auth.uid()))
  );

-- Temps réel pour la messagerie
alter publication supabase_realtime add table public.messages;

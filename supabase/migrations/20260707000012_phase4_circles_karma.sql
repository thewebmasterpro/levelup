-- LevelUpNow — Migration 12 : Phase 4 (cercles confidentiels + karma d'entraide)
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-07.

-- ============ Cercles confidentiels (dirigeants vérifiés) ============
alter table public.conversations add column is_confidential boolean not null default false;

create function public.has_verified_company(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.companies
    where owner_id = uid and bce_verified = true
  );
$$;
revoke execute on function public.has_verified_company(uuid) from public, anon;
grant execute on function public.has_verified_company(uuid) to authenticated;

-- Créer un cercle confidentiel exige une entreprise vérifiée BCE
create function public.protect_confidential_conversations()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.is_confidential
     and (select auth.uid()) is not null
     and not public.has_verified_company((select auth.uid())) then
    raise exception 'Les cercles confidentiels sont réservés aux dirigeants dont une entreprise est vérifiée BCE';
  end if;
  return new;
end;
$$;
revoke execute on function public.protect_confidential_conversations() from public, anon, authenticated;

create trigger conversations_protect_confidential
  before insert on public.conversations
  for each row execute function public.protect_confidential_conversations();

-- Dans un cercle confidentiel, on ne peut ajouter que des dirigeants vérifiés
create function public.protect_circle_participants()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare confidential boolean;
begin
  select is_confidential into confidential from public.conversations where id = new.conversation_id;
  if confidential and not public.has_verified_company(new.profile_id) then
    raise exception 'Seuls les dirigeants vérifiés BCE peuvent rejoindre un cercle confidentiel';
  end if;
  return new;
end;
$$;
revoke execute on function public.protect_circle_participants() from public, anon, authenticated;

create trigger conversation_participants_protect_circle
  before insert on public.conversation_participants
  for each row execute function public.protect_circle_participants();

-- ============ Karma d'entraide (top contributeurs) ============
-- Points gagnés uniquement en AIDANT : commentaires, meilleures réponses,
-- réponses retenues sur la marketplace, ressources validées, formations données.
create function public.karma_leaderboard(limit_count int default 10)
returns table (
  profile_id uuid,
  full_name text,
  avatar_url text,
  points bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.full_name,
    p.avatar_url,
    coalesce((select count(*) from public.comments c where c.author_id = p.id), 0) * 2
    + coalesce((select count(*) from public.posts po
        join public.comments bc on bc.id = po.best_comment_id
        where bc.author_id = p.id), 0) * 10
    + coalesce((select count(*) from public.listing_responses lr
        where lr.responder_id = p.id and lr.selected), 0) * 15
    + coalesce((select count(*) from public.resources r
        where r.submitted_by = p.id and r.status = 'approved'), 0) * 5
    + coalesce((select count(*) from public.courses co
        where co.trainer_id = p.id and co.status = 'published'), 0) * 10
    + coalesce((select count(*) from public.reactions re
        join public.posts po2 on po2.id = re.post_id
        where po2.author_id = p.id and re.profile_id <> p.id), 0)
    as points
  from public.profiles p
  where p.status = 'approved'
  order by points desc, p.full_name
  limit limit_count;
$$;
revoke execute on function public.karma_leaderboard(int) from public, anon;
grant execute on function public.karma_leaderboard(int) to authenticated;

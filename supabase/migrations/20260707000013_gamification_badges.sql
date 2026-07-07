-- LevelUpNow — Migration 13 : gamification (badges automatiques, karma individuel, classement mensuel)
-- À appliquer sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht).

drop function if exists public.karma_leaderboard(int);

create function public.karma_leaderboard(limit_count int default 10, since timestamptz default null)
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
    coalesce((select count(*) from public.comments c
        where c.author_id = p.id and (since is null or c.created_at >= since)), 0) * 2
    + coalesce((select count(*) from public.posts po
        join public.comments bc on bc.id = po.best_comment_id
        where bc.author_id = p.id and (since is null or bc.created_at >= since)), 0) * 10
    + coalesce((select count(*) from public.listing_responses lr
        where lr.responder_id = p.id and lr.selected
          and (since is null or lr.created_at >= since)), 0) * 15
    + coalesce((select count(*) from public.resources r
        where r.submitted_by = p.id and r.status = 'approved'
          and (since is null or r.created_at >= since)), 0) * 5
    + coalesce((select count(*) from public.courses co
        where co.trainer_id = p.id and co.status = 'published'
          and (since is null or co.created_at >= since)), 0) * 10
    + coalesce((select count(*) from public.reactions re
        join public.posts po2 on po2.id = re.post_id
        where po2.author_id = p.id and re.profile_id <> p.id
          and (since is null or re.created_at >= since)), 0)
    as points
  from public.profiles p
  where p.status = 'approved'
  order by points desc, p.full_name
  limit limit_count;
$$;
revoke execute on function public.karma_leaderboard(int, timestamptz) from public, anon;
grant execute on function public.karma_leaderboard(int, timestamptz) to authenticated;

-- Statistiques de contribution d'un membre (portfolio)
create function public.member_stats(uid uuid)
returns table (
  comments bigint,
  best_answers bigint,
  selected_responses bigint,
  resources bigint,
  courses bigint,
  accepted_connections bigint,
  karma bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*) from public.comments c where c.author_id = uid),
    (select count(*) from public.posts po join public.comments bc on bc.id = po.best_comment_id where bc.author_id = uid),
    (select count(*) from public.listing_responses lr where lr.responder_id = uid and lr.selected),
    (select count(*) from public.resources r where r.submitted_by = uid and r.status = 'approved'),
    (select count(*) from public.courses co where co.trainer_id = uid and co.status = 'published'),
    (select count(*) from public.connections cn where (cn.requester_id = uid or cn.addressee_id = uid) and cn.status = 'accepted'),
    (select points from public.karma_leaderboard(100000) k where k.profile_id = uid);
$$;
revoke execute on function public.member_stats(uuid) from public, anon;
grant execute on function public.member_stats(uuid) to authenticated;

-- Badges automatiques, calculés depuis l'activité réelle (non achetables)
create function public.member_badges(uid uuid)
returns table (badge text)
language sql
stable
security definer
set search_path = ''
as $$
  select '🥇 Membre fondateur' where uid in (
    select id from public.profiles where status = 'approved' order by created_at limit 50
  )
  union all
  select '✓ Dirigeant vérifié' where public.has_verified_company(uid)
  union all
  select '🎓 Formateur' where exists (
    select 1 from public.courses where trainer_id = uid and status = 'published'
  )
  union all
  select '💡 Expert' where (
    select count(*) from public.posts po
    join public.comments bc on bc.id = po.best_comment_id
    where bc.author_id = uid
  ) >= 3
  union all
  select '🤝 Connecteur' where (
    select count(*) from public.connections cn
    where (cn.requester_id = uid or cn.addressee_id = uid) and cn.status = 'accepted'
  ) >= 5
  union all
  select '🏛️ Pilier du club' where (
    select points from public.karma_leaderboard(100000) k where k.profile_id = uid
  ) >= 100;
$$;
revoke execute on function public.member_badges(uuid) from public, anon;
grant execute on function public.member_badges(uuid) to authenticated;

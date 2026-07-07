-- LevelUpNow — Migration 11 : Phase 3 (matching hebdo, marketplace, formations)
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-06.
-- NB : le SQL complet appliqué est identique au bloc ci-dessous.

-- ============ Matching hebdomadaire (coffee roulette) ============
create table public.weekly_matches (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  member_a uuid not null references public.profiles (id) on delete cascade,
  member_b uuid not null references public.profiles (id) on delete cascade,
  score int not null default 0,
  a_action text not null default 'pending' check (a_action in ('pending', 'contacted', 'skipped')),
  b_action text not null default 'pending' check (b_action in ('pending', 'contacted', 'skipped')),
  created_at timestamptz not null default now(),
  unique (week_start, member_a, member_b),
  check (member_a <> member_b)
);

create index weekly_matches_week_idx on public.weekly_matches (week_start);

alter table public.weekly_matches enable row level security;

create policy "Voir ses matchs"
  on public.weekly_matches for select
  to authenticated
  using (member_a = (select auth.uid()) or member_b = (select auth.uid()));

create policy "Réagir à ses matchs"
  on public.weekly_matches for update
  to authenticated
  using (member_a = (select auth.uid()) or member_b = (select auth.uid()))
  with check (member_a = (select auth.uid()) or member_b = (select auth.uid()));

-- Génération : score = régions communes ×2 + secteurs communs + annonces
-- ouvertes correspondant au secteur de l'autre ×3 ; max 3 matchs/membre/semaine ;
-- pas de re-match dans les 4 semaines ; jamais entre membres déjà connectés.
create function public.generate_weekly_matches()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  wk date := (date_trunc('week', now()))::date;
  inserted int := 0;
  r record;
begin
  for r in
    with members as (
      select id from public.profiles where status = 'approved'
    ),
    pairs as (
      select m1.id as a, m2.id as b
      from members m1
      join members m2 on m1.id < m2.id
      where not exists (
        select 1 from public.connections c
        where (c.requester_id = m1.id and c.addressee_id = m2.id)
           or (c.requester_id = m2.id and c.addressee_id = m1.id)
      )
      and not exists (
        select 1 from public.weekly_matches w
        where w.week_start > wk - interval '28 days'
          and ((w.member_a = m1.id and w.member_b = m2.id)
            or (w.member_a = m2.id and w.member_b = m1.id))
      )
    )
    select p.a, p.b,
      (select count(*) from public.profile_regions ra
        join public.profile_regions rb on ra.region_id = rb.region_id
        where ra.profile_id = p.a and rb.profile_id = p.b) * 2
      + (select count(*) from public.profile_sectors sa
        join public.profile_sectors sb on sa.sector_id = sb.sector_id
        where sa.profile_id = p.a and sb.profile_id = p.b)
      + (select count(*) from public.listings l
        join public.profile_sectors ps on ps.sector_id = l.sector_id
        where l.status = 'open'
          and ((l.author_id = p.a and ps.profile_id = p.b)
            or (l.author_id = p.b and ps.profile_id = p.a))) * 3
      as score
    from pairs p
    order by 3 desc
  loop
    if (select count(*) from public.weekly_matches w
        where w.week_start = wk and (w.member_a = r.a or w.member_b = r.a)) < 3
      and (select count(*) from public.weekly_matches w
        where w.week_start = wk and (w.member_a = r.b or w.member_b = r.b)) < 3 then
      insert into public.weekly_matches (week_start, member_a, member_b, score)
      values (wk, r.a, r.b, r.score)
      on conflict do nothing;
      inserted := inserted + 1;
    end if;
  end loop;

  insert into public.notifications (recipient_id, kind, message, link)
  select member_a, 'weekly_match', '☕ Vos mises en relation de la semaine sont prêtes !', '/espace/matchs'
  from public.weekly_matches where week_start = wk
  union
  select member_b, 'weekly_match', '☕ Vos mises en relation de la semaine sont prêtes !', '/espace/matchs'
  from public.weekly_matches where week_start = wk;

  return inserted;
end;
$$;
revoke execute on function public.generate_weekly_matches() from public, anon, authenticated;

-- Cron : chaque lundi à 08h00 (UTC)
create extension if not exists pg_cron;
select cron.schedule(
  'weekly-matching',
  '0 8 * * 1',
  $$select public.generate_weekly_matches()$$
);

-- ============ Marketplace : réponses aux annonces ============
create table public.listing_responses (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  responder_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  price_indication text,
  selected boolean not null default false,
  created_at timestamptz not null default now(),
  unique (listing_id, responder_id)
);

alter table public.listing_responses enable row level security;

create policy "Voir les réponses (auteur de l'annonce ou répondant)"
  on public.listing_responses for select
  to authenticated
  using (
    responder_id = (select auth.uid())
    or exists (
      select 1 from public.listings l
      where l.id = listing_id and l.author_id = (select auth.uid())
    )
  );

create policy "Répondre à une annonce"
  on public.listing_responses for insert
  to authenticated
  with check (
    responder_id = (select auth.uid())
    and public.is_approved_member((select auth.uid()))
    and not exists (
      select 1 from public.listings l
      where l.id = listing_id and l.author_id = (select auth.uid())
    )
  );

create policy "L'auteur de l'annonce sélectionne"
  on public.listing_responses for update
  to authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id and l.author_id = (select auth.uid())
    )
  );

create policy "Retirer sa réponse"
  on public.listing_responses for delete
  to authenticated
  using (responder_id = (select auth.uid()));

create function public.handle_listing_response()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare listing_author uuid; listing_title text; responder_name text;
begin
  select author_id, title into listing_author, listing_title
  from public.listings where id = new.listing_id;
  if tg_op = 'INSERT' then
    select full_name into responder_name from public.profiles where id = new.responder_id;
    perform public.notify(
      listing_author,
      'listing_response',
      '📬 ' || coalesce(responder_name, 'Un membre') || ' a répondu à votre annonce « ' || listing_title || ' »',
      '/espace/annonces'
    );
  elsif tg_op = 'UPDATE' and new.selected and not old.selected then
    perform public.notify(
      new.responder_id,
      'response_selected',
      '🎉 Votre réponse à « ' || listing_title || ' » a été retenue !',
      '/espace/annonces'
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_listing_response() from public, anon, authenticated;

create trigger listing_responses_notify
  after insert or update on public.listing_responses
  for each row execute function public.handle_listing_response();

-- ============ Formations ============
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  format text not null default 'visio' check (format in ('presentiel', 'visio', 'elearning', 'webinaire')),
  price_cents int not null default 0,
  location text,
  starts_at timestamptz,
  duration_text text,
  capacity int,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now()
);

create table public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  position int not null default 1,
  title text not null,
  video_url text,
  content text,
  created_at timestamptz not null default now()
);

create table public.course_enrollments (
  course_id uuid not null references public.courses (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (course_id, profile_id)
);

create table public.lesson_done (
  lesson_id uuid not null references public.course_lessons (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  done_at timestamptz not null default now(),
  primary key (lesson_id, profile_id)
);

create table public.course_reviews (
  course_id uuid not null references public.courses (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  primary key (course_id, profile_id)
);

alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.lesson_done enable row level security;
alter table public.course_reviews enable row level security;

create policy "Formations publiées visibles par les membres"
  on public.courses for select
  to authenticated
  using (
    (status = 'published' and public.is_approved_member((select auth.uid())))
    or trainer_id = (select auth.uid())
    or public.is_staff((select auth.uid()))
  );

create policy "Créer et gérer ses formations"
  on public.courses for all
  to authenticated
  using (trainer_id = (select auth.uid()))
  with check (trainer_id = (select auth.uid()) and public.is_approved_member((select auth.uid())));

create policy "Le staff modère les formations"
  on public.courses for delete
  to authenticated
  using (public.is_staff((select auth.uid())));

create policy "Leçons visibles par les inscrits et le formateur"
  on public.course_lessons for select
  to authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (
          c.trainer_id = (select auth.uid())
          or exists (
            select 1 from public.course_enrollments e
            where e.course_id = c.id and e.profile_id = (select auth.uid())
          )
        )
    )
  );

create policy "Le formateur gère ses leçons"
  on public.course_lessons for all
  to authenticated
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id and c.trainer_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      where c.id = course_id and c.trainer_id = (select auth.uid())
    )
  );

create policy "Inscriptions visibles (formateur et inscrit)"
  on public.course_enrollments for select
  to authenticated
  using (
    profile_id = (select auth.uid())
    or exists (
      select 1 from public.courses c
      where c.id = course_id and c.trainer_id = (select auth.uid())
    )
  );

create policy "S'inscrire à une formation"
  on public.course_enrollments for insert
  to authenticated
  with check (profile_id = (select auth.uid()) and public.is_approved_member((select auth.uid())));

create policy "Se désinscrire"
  on public.course_enrollments for delete
  to authenticated
  using (profile_id = (select auth.uid()));

create policy "Gérer sa progression"
  on public.lesson_done for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy "Avis visibles par les membres"
  on public.course_reviews for select
  to authenticated
  using (public.is_approved_member((select auth.uid())));

create policy "Donner son avis (inscrits uniquement)"
  on public.course_reviews for all
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (
    profile_id = (select auth.uid())
    and exists (
      select 1 from public.course_enrollments e
      where e.course_id = course_reviews.course_id and e.profile_id = (select auth.uid())
    )
  );

create function public.handle_course_enrollment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare trainer uuid; course_title text; student_name text;
begin
  select trainer_id, title into trainer, course_title from public.courses where id = new.course_id;
  select full_name into student_name from public.profiles where id = new.profile_id;
  if trainer is not null and trainer <> new.profile_id then
    perform public.notify(
      trainer,
      'course_enrollment',
      '🎓 ' || coalesce(student_name, 'Un membre') || ' s''est inscrit à votre formation « ' || course_title || ' »',
      '/espace/formations/' || new.course_id
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_course_enrollment() from public, anon, authenticated;

create trigger course_enrollments_notify
  after insert on public.course_enrollments
  for each row execute function public.handle_course_enrollment();

-- Matchs de la semaine en cours (première génération immédiate)
select public.generate_weekly_matches();

-- LevelUpNow — Migration 8 : fin de Phase 1 (avatars, notifications, signalements)
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-06.

-- ============ Avatars (Storage) ============
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatars publics en lecture"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "Déposer son avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Mettre à jour son avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Supprimer son avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ============ Notifications ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  message text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy "Voir ses notifications"
  on public.notifications for select
  to authenticated
  using (recipient_id = (select auth.uid()));

create policy "Marquer ses notifications comme lues"
  on public.notifications for update
  to authenticated
  using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

create policy "Supprimer ses notifications"
  on public.notifications for delete
  to authenticated
  using (recipient_id = (select auth.uid()));

-- Les notifications sont créées uniquement par des triggers (security definer)
create function public.notify(recipient uuid, kind text, message text, link text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (recipient_id, kind, message, link)
  values (recipient, kind, message, link);
$$;
revoke execute on function public.notify(uuid, text, text, text) from public, anon, authenticated;

create function public.handle_connection_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare requester_name text;
begin
  select full_name into requester_name from public.profiles where id = new.requester_id;
  perform public.notify(
    new.addressee_id,
    'connection_request',
    coalesce(requester_name, 'Un membre') || ' souhaite entrer en relation avec vous',
    '/espace/annuaire'
  );
  return new;
end;
$$;
revoke execute on function public.handle_connection_insert() from public, anon, authenticated;

create trigger connections_notify_insert
  after insert on public.connections
  for each row execute function public.handle_connection_insert();

create function public.handle_connection_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare addressee_name text;
begin
  if new.status = 'accepted' and old.status = 'pending' then
    select full_name into addressee_name from public.profiles where id = new.addressee_id;
    perform public.notify(
      new.requester_id,
      'connection_accepted',
      coalesce(addressee_name, 'Un membre') || ' a accepté votre demande de mise en relation',
      '/espace/annuaire'
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_connection_update() from public, anon, authenticated;

create trigger connections_notify_update
  after update on public.connections
  for each row execute function public.handle_connection_update();

create function public.handle_comment_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare post_author uuid; commenter_name text;
begin
  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is not null and post_author <> new.author_id then
    select full_name into commenter_name from public.profiles where id = new.author_id;
    perform public.notify(
      post_author,
      'comment',
      coalesce(commenter_name, 'Un membre') || ' a commenté votre publication',
      '/espace'
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_comment_insert() from public, anon, authenticated;

create trigger comments_notify_insert
  after insert on public.comments
  for each row execute function public.handle_comment_insert();

create function public.handle_profile_approved()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'approved' and old.status <> 'approved' then
    perform public.notify(
      new.id,
      'approved',
      'Votre candidature est validée — bienvenue dans la communauté ! 🎉',
      '/espace'
    );
  end if;
  return new;
end;
$$;
revoke execute on function public.handle_profile_approved() from public, anon, authenticated;

create trigger profiles_notify_approved
  after update on public.profiles
  for each row execute function public.handle_profile_approved();

-- ============ Signalements ============
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'profile')),
  target_id uuid not null,
  reason text,
  excerpt text,
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at);

alter table public.reports enable row level security;

create policy "Signaler un contenu"
  on public.reports for insert
  to authenticated
  with check (reporter_id = (select auth.uid()) and public.is_approved_member((select auth.uid())));

create policy "Le staff voit les signalements"
  on public.reports for select
  to authenticated
  using (public.is_staff((select auth.uid())));

create policy "Le staff traite les signalements"
  on public.reports for update
  to authenticated
  using (public.is_staff((select auth.uid())))
  with check (public.is_staff((select auth.uid())));

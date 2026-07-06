-- LevelUpNow — Migration 9 : correction de la récursion RLS sur profiles
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-06.

-- La policy « Modifier son propre profil » référençait public.profiles dans
-- son WITH CHECK → récursion infinie : aucun membre ne pouvait modifier son
-- profil. On simplifie la policy et on protège role/status par trigger.

drop policy "Modifier son propre profil" on public.profiles;

create policy "Modifier son propre profil"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Garde-fou : seuls les admins/modérateurs (ou le backend) peuvent changer
-- role et status — un membre ne peut pas s'auto-approuver ni s'auto-promouvoir.
create function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and (select auth.uid()) is not null
     and not public.is_staff((select auth.uid())) then
    raise exception 'Modification de role/status réservée aux administrateurs';
  end if;
  return new;
end;
$$;
revoke execute on function public.protect_profile_privileges() from public, anon, authenticated;

create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

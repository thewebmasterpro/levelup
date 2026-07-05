-- BizClub — Migration 4 : durcissement (suite aux advisors sécurité Supabase)
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-05.

-- search_path figé sur la fonction trigger
alter function public.set_updated_at() set search_path = '';

-- Les helpers RLS ne doivent pas être appelables par les visiteurs non connectés,
-- mais restent exécutables par les utilisateurs connectés (les policies en dépendent).
revoke execute on function public.is_approved_member(uuid) from public, anon;
grant execute on function public.is_approved_member(uuid) to authenticated;

revoke execute on function public.is_staff(uuid) from public, anon;
grant execute on function public.is_staff(uuid) to authenticated;

revoke execute on function public.is_conversation_participant(uuid, uuid) from public, anon;
grant execute on function public.is_conversation_participant(uuid, uuid) to authenticated;

-- Le trigger d'inscription n'a pas à être exposé via l'API du tout
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

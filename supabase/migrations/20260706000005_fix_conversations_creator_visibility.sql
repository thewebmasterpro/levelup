-- BizClub — Migration 5 : le créateur d'une conversation la voit immédiatement
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-06.

-- Sans cela, il ne peut pas y ajouter les participants : la policy d'insertion
-- des participants vérifie created_by via un select sur conversations,
-- lui-même soumis au RLS (qui n'autorisait que les participants).
drop policy "Voir ses conversations" on public.conversations;
create policy "Voir ses conversations"
  on public.conversations for select
  to authenticated
  using (
    created_by = (select auth.uid())
    or public.is_conversation_participant(id, (select auth.uid()))
  );

-- Nettoyage des conversations orphelines créées avant ce correctif
delete from public.conversations c
where not exists (
  select 1 from public.conversation_participants p where p.conversation_id = c.id
);

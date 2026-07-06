-- BizClub — Migration 6 : lancement en Belgique
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-06.
-- Remplace les régions françaises par les provinces belges + Bruxelles-Capitale.

-- Les chapitres régionaux d'abord (region_id est ON DELETE SET NULL, ce qui
-- violerait la contrainte chapter_type_target si on supprimait les régions avant)
delete from public.chapters where type = 'region';

-- « International » n'est pas une région française : on la conserve
update public.regions set country = 'INT' where code = 'INT';
delete from public.regions where country = 'FR';

alter table public.regions alter column country set default 'BE';

insert into public.regions (code, name, country) values
  ('BRU', 'Bruxelles-Capitale', 'BE'),
  ('VAN', 'Anvers', 'BE'),
  ('VBR', 'Brabant flamand', 'BE'),
  ('WBR', 'Brabant wallon', 'BE'),
  ('VWV', 'Flandre-Occidentale', 'BE'),
  ('VOV', 'Flandre-Orientale', 'BE'),
  ('WHT', 'Hainaut', 'BE'),
  ('WLG', 'Liège', 'BE'),
  ('VLI', 'Limbourg', 'BE'),
  ('WLX', 'Luxembourg', 'BE'),
  ('WNA', 'Namur', 'BE');

-- Un chapitre régional par province belge
insert into public.chapters (type, slug, name, description, region_id)
select
  'region',
  'region-' || lower(code),
  name,
  'Le réseau des entrepreneurs — ' || name,
  id
from public.regions
where country = 'BE';

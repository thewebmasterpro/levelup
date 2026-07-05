-- BizClub — Migration 3 : données de référence
-- Appliquée sur le projet Supabase `bizclub` (bfswcewynlmqpgrphzht) le 2026-07-05.

insert into public.regions (code, name) values
  ('ARA', 'Auvergne-Rhône-Alpes'),
  ('BFC', 'Bourgogne-Franche-Comté'),
  ('BRE', 'Bretagne'),
  ('CVL', 'Centre-Val de Loire'),
  ('COR', 'Corse'),
  ('GES', 'Grand Est'),
  ('HDF', 'Hauts-de-France'),
  ('IDF', 'Île-de-France'),
  ('NOR', 'Normandie'),
  ('NAQ', 'Nouvelle-Aquitaine'),
  ('OCC', 'Occitanie'),
  ('PDL', 'Pays de la Loire'),
  ('PAC', 'Provence-Alpes-Côte d''Azur'),
  ('DOM', 'Outre-mer'),
  ('INT', 'International');

insert into public.sectors (slug, name) values
  ('tech-numerique', 'Tech & Numérique'),
  ('commerce-retail', 'Commerce & Retail'),
  ('artisanat', 'Artisanat'),
  ('btp-construction', 'BTP & Construction'),
  ('restauration-hotellerie', 'Restauration & Hôtellerie'),
  ('sante-bien-etre', 'Santé & Bien-être'),
  ('finance-assurance', 'Finance & Assurance'),
  ('immobilier', 'Immobilier'),
  ('marketing-communication', 'Marketing & Communication'),
  ('conseil', 'Conseil'),
  ('formation-education', 'Formation & Éducation'),
  ('industrie', 'Industrie'),
  ('transport-logistique', 'Transport & Logistique'),
  ('agriculture-agroalimentaire', 'Agriculture & Agroalimentaire'),
  ('culture-medias', 'Culture & Médias'),
  ('services-entreprises', 'Services aux entreprises'),
  ('services-personne', 'Services à la personne'),
  ('tourisme-loisirs', 'Tourisme & Loisirs'),
  ('energie-environnement', 'Énergie & Environnement'),
  ('juridique', 'Juridique'),
  ('autre', 'Autre');

-- Espaces thématiques de départ
insert into public.chapters (type, slug, name, description) values
  ('thematic', 'financement', 'Financement', 'Levées de fonds, prêts, aides et subventions'),
  ('thematic', 'marketing-ventes', 'Marketing & Ventes', 'Acquisition, communication, prospection, pricing'),
  ('thematic', 'juridique-compta', 'Juridique & Compta', 'Statuts, contrats, fiscalité, comptabilité'),
  ('thematic', 'recrutement-rh', 'Recrutement & RH', 'Embaucher, manager, fidéliser'),
  ('thematic', 'outils-productivite', 'Outils & Productivité', 'Logiciels, IA, automatisation, organisation'),
  ('thematic', 'entraide-generale', 'Entraide générale', 'Toutes les questions qui ne rentrent pas ailleurs');

-- Un chapitre régional par région (networking local dès le premier jour)
insert into public.chapters (type, slug, name, description, region_id)
select
  'region',
  'region-' || lower(code),
  name,
  'Le réseau des entrepreneurs de la région ' || name,
  id
from public.regions
where code not in ('INT');

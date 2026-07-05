# BizClub — Plateforme communautaire pour entrepreneurs

BizClub est une application qui offre aux entrepreneurs un espace pour **échanger, discuter, partager des informations et des contacts, et proposer des formations**. Positionnement généraliste, avec un networking segmentable par **région** et par **secteur** dès la conception.

## Documentation

- 📋 [Plan d'action complet](docs/PLAN_ACTION.md) — vision, liste des fonctionnalités, stack technique et roadmap détaillée.
- 💎 [Catalogue des 50 features différenciantes](docs/KILLER_FEATURES.md) — dont les 7 killer features prioritaires intégrées à la roadmap.

## Stack

- **Frontend** : Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Auth, Realtime) — projet `bizclub` (`bfswcewynlmqpgrphzht`, eu-west-1)
- **Migrations** : versionnées dans [`supabase/migrations/`](supabase/migrations/) (déjà appliquées sur le projet distant)

## Démarrage

```bash
cp .env.example .env.local   # les clés publiques Supabase y sont déjà
npm install
npm run dev
```

L'application tourne sur [http://localhost:3000](http://localhost:3000).

## Ce qui est en place (Phase 1 — MVP, en cours)

- ✅ Schéma de base de données complet avec RLS : profils (avec validation d'adhésion), régions/secteurs, chapitres (thématiques + régionaux), mises en relation, publications/commentaires/réactions, messagerie temps réel
- ✅ Inscription / connexion par email, création automatique du profil, statut « en attente de validation »
- ✅ Page d'accueil publique, espace membre protégé listant les chapitres
- 🔜 Annuaire des membres, fil d'actualité, messagerie UI, back-office de validation

## Administration (en attendant le back-office)

Pour approuver un membre, dans le SQL Editor de Supabase :

```sql
update public.profiles set status = 'approved' where id = '<user_id>';
-- Pour donner les droits admin :
update public.profiles set role = 'admin' where id = '<user_id>';
```

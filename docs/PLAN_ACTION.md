# Plan d'action — BizClub, la plateforme des entrepreneurs

> Espace communautaire pour entrepreneurs : échanger, discuter, partager des informations et des contacts, et proposer des formations.

---

## 1. Vision et positionnement

**Le problème** : les entrepreneurs (fondateurs, indépendants, dirigeants de TPE/PME) sont isolés. Les échanges se dispersent entre LinkedIn (bruyant), les groupes WhatsApp/Facebook (désorganisés, non capitalisés) et les événements physiques (ponctuels). Il n'existe pas d'espace dédié où networking, entraide et montée en compétences se retrouvent au même endroit.

**La solution** : une plateforme privée qui combine :
1. **Communauté** — discussions structurées par thématiques, entraide entre pairs.
2. **Networking** — annuaire de membres qualifié, mise en relation, échange de contacts.
3. **Formation** — catalogue de formations proposées par des experts (membres ou partenaires).
4. **Ressources** — bibliothèque de documents, modèles, guides partagés.

**Cibles (personas)** :
| Persona | Besoin principal |
|---|---|
| Créateur d'entreprise (0–2 ans) | Conseils pratiques, éviter les erreurs, trouver ses premiers contacts |
| Indépendant / freelance | Réseau, opportunités de missions, visibilité |
| Dirigeant TPE/PME établi | Pairs de son niveau, partenariats, veille |
| Expert / formateur | Audience qualifiée pour vendre ses formations et son accompagnement |

**Différenciation** : communauté qualifiée (adhésion validée), contenu capitalisé et recherchable, et un modèle où les membres experts peuvent monétiser leurs formations — la plateforme devient un écosystème, pas juste un forum.

---

## 2. Liste des fonctionnalités

### Module A — Comptes et profils
- [ ] Inscription / connexion (email + mot de passe, Google, LinkedIn)
- [ ] Validation des candidatures (adhésion sur dossier ou parrainage) — garantit la qualité de la communauté
- [ ] Profil entrepreneur : photo, bio, secteur d'activité, entreprise, compétences, localisation, liens (site, LinkedIn)
- [ ] Badges et statuts (membre fondateur, expert certifié, formateur, mentor…)
- [ ] Paramètres de confidentialité (profil visible / masqué, coordonnées sur demande)

### Module B — Annuaire et networking
- [ ] Annuaire des membres avec recherche et filtres (secteur, compétence, ville, besoin)
- [ ] Demandes de mise en relation (accepter / refuser, message d'introduction)
- [ ] Carnet de contacts personnel (mes connexions)
- [ ] Partage de contact / carte de visite numérique (QR code pour les événements physiques)
- [ ] Suggestions de mises en relation ("membres qui pourraient vous intéresser")
- [ ] Offres et demandes : petit "marketplace" d'annonces (recherche associé, mission freelance, partenariat…)

### Module C — Échanges et discussions
- [ ] Fil d'actualité de la communauté (posts, images, liens, sondages)
- [ ] Espaces thématiques / groupes (ex. financement, marketing, juridique, par ville ou secteur)
- [ ] Réactions, commentaires, mentions @membre
- [ ] Messagerie privée 1-à-1 et de groupe (temps réel)
- [ ] Questions/réponses avec "meilleure réponse" (capitalisation de l'entraide)
- [ ] Recherche plein texte dans les discussions
- [ ] Signalement de contenu + outils de modération

### Module D — Partage d'informations et ressources
- [ ] Bibliothèque de ressources (PDF, modèles de documents, guides, replays)
- [ ] Classement par catégories et tags, recherche
- [ ] Dépôt de ressources par les membres (avec validation)
- [ ] Veille / articles épinglés par les administrateurs
- [ ] Newsletter automatique (résumé hebdo de l'activité)

### Module E — Formations
- [ ] Catalogue de formations (présentiel, visio, e-learning)
- [ ] Fiche formation : programme, formateur, prix, dates, niveau
- [ ] Inscription et paiement en ligne
- [ ] Cours en ligne : vidéos, chapitres, quiz, suivi de progression
- [ ] Espace formateur : créer et gérer ses formations, suivre ses inscrits et ses revenus
- [ ] Attestations / certificats de complétion
- [ ] Avis et notes sur les formations
- [ ] Sessions live (webinaires) avec replay

### Module F — Événements
- [ ] Agenda des événements (afterworks, ateliers, conférences, visio)
- [ ] Inscription / billetterie (gratuit ou payant)
- [ ] Rappels automatiques et fichier .ics
- [ ] Liste des participants visible (pour préparer son networking)
- [ ] Check-in le jour J (QR code)

### Module G — Monétisation et abonnements
- [ ] Formules d'adhésion : Gratuit (découverte) / Membre (accès complet) / Premium (formations incluses, visibilité renforcée)
- [ ] Paiement récurrent (Stripe) : cartes, prélèvement SEPA
- [ ] Commission sur les formations vendues par les formateurs (ex. 15–20 %)
- [ ] Billetterie événements payants
- [ ] Espaces sponsorisés / partenaires (plus tard)

### Module H — Administration et animation
- [ ] Back-office : gestion des membres, validation des candidatures, statistiques
- [ ] Modération : file de signalements, suspension, règles de la communauté
- [ ] Tableau de bord : membres actifs, rétention, revenus, engagement
- [ ] Outils d'animation : posts programmés, défis / thèmes de la semaine, mise en avant de membres
- [ ] Notifications (in-app, email, push mobile) avec préférences par membre

---

## 3. Stack technique recommandée

| Couche | Choix recommandé | Pourquoi |
|---|---|---|
| Frontend web | **Next.js (React) + TypeScript + Tailwind CSS** | Rapidité de développement, SEO pour les pages publiques, écosystème riche |
| Mobile | PWA d'abord, puis **React Native / Expo** en phase 3 | Une PWA couvre 90 % des besoins au lancement sans doubler l'effort |
| Backend & BDD | **Supabase** (PostgreSQL, Auth, Storage, Realtime) | Auth sociale intégrée, temps réel pour la messagerie, permissions fines (RLS), très rapide à mettre en place |
| Paiements | **Stripe** (Billing pour abonnements + Connect pour reverser aux formateurs) | Standard du marché, gère les commissions automatiquement |
| Vidéo | Mux ou Vimeo (hébergement cours), Livekit/Zoom (webinaires) | Streaming fiable sans réinventer la roue |
| Emails | Resend ou Brevo | Transactionnel + newsletter |
| Hébergement | Vercel (front) + Supabase (back) | Déploiement continu, coût quasi nul au démarrage |

Cette stack permet à une très petite équipe (1 à 3 devs) de livrer un MVP en quelques semaines et de scaler ensuite sans refonte.

---

## 4. Roadmap

### Phase 0 — Cadrage et validation *(2–4 semaines)*
**Objectif : valider l'intérêt avant de coder.**
- Définir le positionnement précis (généraliste ? par région ? par secteur ?)
- Interviewer 15–20 entrepreneurs cibles sur leurs besoins réels
- Constituer une liste d'attente (landing page + formulaire)
- Recruter 20–50 membres fondateurs et 2–3 formateurs partenaires
- Choisir le nom, l'identité visuelle, rédiger la charte de la communauté

✅ **Critère de passage** : 100+ inscrits sur la liste d'attente, 3 formateurs engagés.

### Phase 1 — MVP : la communauté *(6–8 semaines)*
**Objectif : les échanges quotidiens ont lieu sur la plateforme.**
- Module A : inscription, validation des membres, profils
- Module B (base) : annuaire avec recherche et filtres, demande de mise en relation
- Module C (base) : fil d'actualité, espaces thématiques, commentaires, messagerie privée 1-à-1
- Module H (base) : back-office minimal (validation, modération), notifications email
- Lancement en bêta privée avec les membres fondateurs

✅ **Critère de passage** : 40 %+ des membres actifs chaque semaine, retours qualitatifs positifs.

### Phase 2 — Ressources, événements et premiers revenus *(6–8 semaines)*
**Objectif : créer de la valeur au-delà de la discussion, et commencer à monétiser.**
- Module D : bibliothèque de ressources, newsletter hebdo automatique
- Module F : agenda d'événements, inscriptions, rappels
- Module G (base) : abonnement payant Membre via Stripe, période d'essai
- Module C (complément) : Q&R avec meilleure réponse, recherche plein texte
- Ouverture de l'inscription au-delà des fondateurs

✅ **Critère de passage** : premiers abonnés payants, taux de conversion gratuit→payant mesuré.

### Phase 3 — Formations *(8–10 semaines)*
**Objectif : lancer le pilier formation et le partage de revenus.**
- Module E : catalogue, fiches formation, paiement, espace formateur
- Cours en ligne (vidéos, chapitres, progression) et webinaires live avec replay
- Stripe Connect : reversement automatique aux formateurs avec commission
- Avis et certificats de complétion
- Formule Premium (formations incluses ou à tarif réduit)

✅ **Critère de passage** : 5+ formations au catalogue, premières ventes, NPS formateurs positif.

### Phase 4 — Croissance et mobile *(en continu)*
**Objectif : scaler la communauté et l'engagement.**
- Application mobile (React Native / Expo) avec notifications push
- Suggestions de mise en relation intelligentes (matching)
- Marketplace d'annonces (missions, associés, partenariats)
- Programme de parrainage, gamification (badges, classements de contribution)
- Espaces sponsorisés, partenariats B2B (banques, assureurs, experts-comptables…)
- Déclinaison par ville / chapitres locaux

---

## 5. Modèle économique

| Source de revenus | Détail |
|---|---|
| Abonnements | Gratuit (limité) / Membre ~15–25 €/mois / Premium ~40–60 €/mois |
| Commission formations | 15–20 % sur chaque vente de formation |
| Billetterie | Marge sur les événements payants |
| Sponsoring | Partenaires visibles auprès d'une audience B2B qualifiée (phase 4) |

## 6. Indicateurs de succès (KPIs)

- **Activation** : % de nouveaux membres qui publient ou se connectent à un autre membre dans les 7 jours
- **Engagement** : membres actifs hebdomadaires (WAU), messages/posts par membre
- **Rétention** : % de membres actifs à M+3
- **Revenus** : MRR abonnements, GMV formations, conversion gratuit→payant
- **Réseau** : mises en relation acceptées par mois

## 7. Risques et parades

| Risque | Parade |
|---|---|
| Communauté fantôme (personne ne poste) | Bêta privée avec noyau dur engagé, animation quotidienne les 3 premiers mois, défis hebdo |
| Démarrage à froid des formations | Recruter 2–3 formateurs partenaires dès la phase 0, co-construire les premières offres |
| Concurrence (LinkedIn, Circle, groupes gratuits) | Qualification des membres + capitalisation du contenu + monétisation pour les experts |
| Modération / qualité des échanges | Charte claire, validation à l'entrée, outils de signalement dès le MVP |
| Trop de features trop tôt | Respecter les critères de passage entre phases — ne pas coder la phase 3 si la phase 1 ne prend pas |

---

## 8. Prochaines étapes immédiates

1. Valider le positionnement (cible, périmètre géographique, nom).
2. Lancer la landing page avec liste d'attente.
3. Mener les entretiens de découverte.
4. En parallèle : initialiser le projet technique (Next.js + Supabase) et maquetter les écrans clés du MVP (fil, annuaire, profil, messagerie).

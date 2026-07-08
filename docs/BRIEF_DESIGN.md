# Briefing design — Refonte LevelUpNow

**Client** : LevelUpNow (bêta) — https://levelupnow.be
**Prestataire** : Open Design
**Contact projet** : contact@thewebmaster.pro
**Date** : juillet 2026

---

## 1. Le produit en une minute

LevelUpNow est un **club privé d'entrepreneurs**, lancé en Belgique. Sur candidature uniquement : chaque membre est validé par l'équipe, et les dirigeants peuvent faire vérifier leur entreprise via son numéro BCE (badge « Vérifiée »).

La plateforme combine quatre piliers :
1. **Échanger** — fil de discussion, questions avec « meilleure réponse », SOS d'urgence, chapitres par thématique et par province belge
2. **Réseauter** — annuaire qualifié, mises en relation, matching hebdomadaire automatique (« 3 membres à rencontrer chaque lundi »), cercles confidentiels entre dirigeants vérifiés
3. **Faire des affaires** — Besoins & Offres avec matching par secteur, marketplace d'appels d'offres internes
4. **Se former** — formations créées par les membres experts, événements, bibliothèque de ressources

**Positionnement face à la concurrence** : plus qualifié que LinkedIn, plus structuré qu'un groupe WhatsApp, plus orienté business réel que Circle/Skool. Le maître-mot : **la confiance entre vrais dirigeants**.

## 2. Objectif de la refonte

Le produit est fonctionnellement complet mais son interface actuelle a été construite par itérations rapides, sans direction artistique. Nous attendons d'Open Design :

1. **Une identité visuelle propriétaire** — logo, palette, typographies, iconographie, ton illustratif. Aujourd'hui : logotype texte « LevelUpNow » + badge « bêta », thème sombre, accent ambre (#fbbf24) sur fond zinc (#09090b). Vous êtes **libres de tout remettre en question**, y compris le thème sombre — en justifiant vos choix face aux personas.
2. **Un design system complet** dans Figma — tokens, composants, états — réutilisable par le développement (voir contraintes techniques §6).
3. **La refonte des écrans existants** (inventaire §4) — pas de nouvelles fonctionnalités : le périmètre fonctionnel est figé.

## 3. Cibles (personas)

| Persona | Contexte | Attente envers le design |
|---|---|---|
| **Créateur d'entreprise** (25-40 ans, 0-2 ans d'activité) | Cherche conseils et premiers contacts, très mobile | Chaleureux, rassurant, pas intimidant |
| **Indépendant / freelance** | Cherche missions et visibilité, consulte entre deux rendez-vous | Rapide, efficace, mobile d'abord |
| **Dirigeant TPE/PME établi** (40-60 ans) | Cherche des pairs et de la discrétion, moins « digital native » | Sérieux, premium, lisible (tailles de texte !) |
| **Expert / formateur** | Vend ses formations à la communauté | Met en valeur son profil et sa crédibilité |

Marché : **Belgique francophone d'abord** (Bruxelles + Wallonie), extension Flandre (NL) puis France prévues. Prévoir des libellés qui survivent à la traduction (textes 30 % plus longs en NL/DE).

## 4. Inventaire des écrans à redessiner

### Partie publique (non connecté)
- **Accueil / landing** — hero, 4 piliers, double CTA (candidater / se connecter), footer légal
- **Connexion / candidature** — un seul écran à deux modes, mot de passe oublié
- **Pages légales** — charte de la communauté, confidentialité, mentions légales (gabarit texte)

### Espace membre (navigation basse mobile : Fil / Club / Annuaire / Messages / Profil)
- **Fil** — composer (3 types : publication, ❓ question, 🆘 SOS), checklist d'accueil des nouveaux, recherche, cartes de post (avatar, badges, réactions, commentaires, meilleure réponse)
- **Club (hub)** — 8 tuiles : Chapitres, Événements, Ressources, Besoins & Offres, Formations, Matchs de la semaine, Mémoire du club, Cercles confidentiels + double classement des contributeurs (mois / général)
- **Chapitres** — liste (thématiques + provinces), page d'un chapitre avec son fil
- **Événements** — cartes avec date/lieu/jauge d'inscription, création (staff)
- **Ressources** — bibliothèque par catégories, proposition avec validation
- **Besoins & Offres** — annonces, formulaire de réponse avec prix, sélection d'une réponse
- **Formations** — catalogue, fiche (inscription, leçons avec progression, avis ⭐), création/édition formateur
- **Matchs de la semaine** — cartes de suggestion avec « Prendre contact / Passer »
- **Mémoire du club** — recherche transversale + « membres à contacter »
- **Cercles confidentiels** — création avec sélection de membres vérifiés, accès verrouillé
- **Annuaire** — recherche + filtres province/secteur, demandes de mise en relation
- **Profil public d'un membre** — avatar, badges de gamification (6), bio, portfolio de contributions (karma), entreprises avec badge « ✓ Vérifiée BCE »
- **Mon profil** — édition, photo, multi-entreprises (n° BCE), provinces/secteurs en pastilles
- **Messages** — conversations 1-à-1 et cercles 🔒, bulles de chat
- **Notifications** — cloche avec badge, liste
- **Admin** (staff uniquement) — stats, validation des candidatures, vérification BCE, signalements

📸 Des captures d'écran de chaque écran actuel peuvent être fournies sur demande, et la bêta est visitable en production (comptes de démonstration fournis au kick-off).

## 5. Personnalité de marque recherchée

- **Club, pas réseau social** : exclusif sans être élitiste, « on se retrousse les manches ensemble »
- **Confiance et sérieux** : de vrais dirigeants vérifiés, de vrais chiffres — mais jamais froid ni corporate
- **Belge et fier de l'être** : ancrage local assumé (provinces, BCE), sans folklore
- **Énergie d'entraide** : les badges, le karma, les victoires célébrées — le design doit rendre la contribution gratifiante

À éviter : le look « startup SaaS générique », les illustrations 3D vues partout, le bleu corporate.

## 6. Contraintes techniques (importantes)

- **Mobile-first strict** : la majorité des usages est sur téléphone ; chaque écran est conçu pour 390 px d'abord, le desktop est une adaptation. L'app est installable en **PWA** (prévoir icône d'app et splash).
- **Stack** : Next.js + Tailwind CSS. Le design system doit être exprimable en **tokens Tailwind** (échelle d'espacement 4 px, rayons, palette avec nuances 50→950). Pas d'effets irréalisables en CSS.
- **Livraison Figma** : composants en auto-layout, variables/tokens Figma, tous les états (hover, focus visible, disabled, erreur, vide, chargement), variantes mobile + desktop des écrans clés.
- **Accessibilité** : contrastes AA minimum, tailles tactiles ≥ 44 px, focus visibles — le persona 40-60 ans nous y oblige autant que la loi.
- **Composants transverses à traiter en priorité** : navigation basse 5 onglets, cartes (post, membre, annonce, événement, formation), pastilles/badges (provinces, secteurs, gamification, « Vérifiée BCE »), formulaires, états vides (nombreux au lancement !), notifications.

## 7. Livrables attendus

1. **Piste créative** : 2-3 directions (moodboard + écran Fil décliné), puis choix ensemble
2. **Identité** : logo (+ déclinaisons favicon/icône PWA), palette, typographies (licences web incluses), iconographie
3. **Design system Figma** : tokens, composants, documentation d'usage
4. **Écrans** : les ~20 écrans de l'inventaire en mobile, + versions desktop pour accueil, fil, annuaire, fiche formation, admin
5. **Kit de handoff** : specs exportables, assets (SVG), correspondance tokens → Tailwind

## 8. Planning et gouvernance souhaités

- **Kick-off** : visite guidée de la bêta + accès aux comptes de démonstration
- **S+2** : pistes créatives → validation d'une direction
- **S+4** : design system + écrans publics
- **S+6** : espace membre complet
- **S+7** : recette croisée avec le développement, ajustements, handoff final

Un point hebdomadaire de 30 min. Les retours seront consolidés en une seule voix côté client.

**Merci d'inclure dans votre proposition** : devis détaillé par livrable, planning ferme, composition de l'équipe, 2-3 références de projets comparables (communauté, B2B, mobile-first), et vos conditions de cession des droits (nous demandons une cession complète et exclusive, licences de polices au nom de LevelUpNow).

---

*Annexes disponibles sur demande : captures d'écran de tous les écrans actuels, plan d'action produit, catalogue des features, accès à la bêta.*

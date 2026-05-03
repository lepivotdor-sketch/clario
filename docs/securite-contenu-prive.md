# Sécurité du contenu privé — Clario

Règles à appliquer pour toute formation, tout document et tout fichier
ajouté au dépôt `clario`.

## Règle d'or

> Tout fichier présent dans ce dépôt public doit être considéré comme
> public, indexable par Google, et téléchargeable par n'importe qui.

GitHub Pages ne protège pas le contenu. Il n'y a pas d'authentification.
Aucune obfuscation, minification ou chargement asynchrone ne rend un
fichier réellement privé.

## Ce qui peut vivre dans ce dépôt (public)

- Les pages HTML / CSS / JS du site vitrine.
- Le fichier `data/formations.json` **réduit aux champs de vente** :
  `id`, `titre`, `categorie`, `prix`, `niveau`, `duree`, `resume_court`,
  `sous_titre`, `promesse`, `resultat_vise_court`, `public_cible`,
  `inclus_public`, `lien_achat`, `statut`.
- Les visuels promotionnels (og-cover, icônes, illustrations).
- La documentation technique d'usage du site (structure du dépôt,
  guide d'ajout d'une nouvelle fiche de vente).

## Ce qui ne doit JAMAIS être mis dans ce dépôt

- Le contenu complet d'une formation : introduction longue, méthode
  pédagogique, étapes détaillées, outil prêt à copier, checklist
  complète, exemple complet, plan d'action, exercices, conclusion.
- Les modèles, scripts, prompts, templates ou PDF vendus.
- Les listes de clients, transactions, courriels.
- Les notes internes, scores qualité, priorité de production,
  potentiel de vente.
- Les titres ou descriptions de formations en préparation qui ne sont
  pas encore en vente.

## Où vit le contenu privé

Le contenu pédagogique complet, les outils livrés après achat et les
listes internes vivent **hors du dépôt public** :

- Stockage privé (Notion privé, Drive privé, dépôt GitHub privé, dossier
  local, etc.).
- Livraison déclenchée après paiement par un système qui ne dépend pas
  du dépôt public (n8n, Stripe webhooks, courriel automatisé).

## Avant chaque commit

1. Le fichier ajouté est-il acceptable s'il est lu par n'importe qui ?
2. Contient-il une méthode complète, un outil livrable, une checklist
   d'action, un exemple complet, des étapes détaillées ?
3. Si oui : il ne va pas dans ce dépôt. Il va dans le stockage privé.

## Audit régulier

Avant chaque mise en ligne d'une nouvelle formation, vérifier que
`data/formations.json` ne contient aucun champ pédagogique :

- pas de `detail`, `methode`, `outil`, `checklist`, `exemple`,
  `plan_action`, `erreurs_a_eviter`, `bilan`, `conclusion`,
  `introduction` longue, `demarrage_rapide` détaillé.

Le rendu public via `js/formation-loader.js` n'affiche que les champs
de vente. Si un champ pédagogique existait dans le JSON, il serait
silencieusement ignoré — mais il serait quand même téléchargeable
directement depuis l'URL du JSON. C'est pour ça qu'il faut le retirer
à la source.

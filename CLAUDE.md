# CLAUDE.md — Instructions permanentes Clario

## Identité du projet

Le projet s’appelle officiellement Clario.

Ne jamais utiliser “Le Pivot d’Or” dans le code, les textes visibles, les commentaires, les titres, les descriptions, les aria-labels, les menus, les pieds de page ou les fichiers publics.

## Objectif actuel

Clario est un site de mini-formations digitales à achat unique.

Objectif principal : préparer 240 formations avant marketing.

Priorités :
1. sécurité du contenu privé ;
2. simplicité ;
3. rentabilité ;
4. SEO ;
5. qualité professionnelle ;
6. vitesse d’exécution ;
7. automatisation progressive.

## Règle public / privé

Le contenu privé client ne doit jamais être publié.

Le dossier privé local est :

_private_local/

Ne jamais publier ni copier dans le site public :
- formation complète ;
- modules complets ;
- exercices complets ;
- fichiers HTML privés ;
- fichiers MD privés ;
- contenus client ;
- sauvegardes privées ;
- roadmap privée ;
- analyses internes sensibles ;
- fichiers de travail privés.

Le contenu public autorisé :
- titre ;
- catégorie ;
- prix ;
- slug ;
- promesse courte ;
- bénéfices marketing ;
- durée ;
- niveau ;
- lien Stripe ;
- aperçu commercial court ;
- métadonnées SEO publiques.

## Fichiers publics principaux

- index.html
- formations.html
- formation.html
- data/formations.json
- js/formation-loader.js
- js/catalogue.js
- css/
- scripts/
- .gitignore
- CLAUDE.md

## Règles Git

Ne jamais faire :

git add .

Toujours utiliser des ajouts ciblés.

Exemples autorisés selon le cas :

git add .gitignore scripts/
git add CLAUDE.md
git add data/formations.json

Ne jamais faire :

git push --force

Avant tout commit :
1. lancer git status --short ;
2. confirmer que _private_local/ n’apparaît pas ;
3. confirmer que les fichiers modifiés sont attendus ;
4. confirmer que data/formations.json n’est modifié que si une formation publique est ajoutée ;
5. lancer les scripts de vérification utiles.

## Scripts disponibles

Backup :

powershell -ExecutionPolicy Bypass -File .\scripts\backup-clario.ps1

Check local :

powershell -ExecutionPolicy Bypass -File .\scripts\check-clario.ps1

Inventaire :

powershell -ExecutionPolicy Bypass -File .\scripts\inventory-clario.ps1

Test live :

powershell -ExecutionPolicy Bypass -File .\scripts\test-live-clario.ps1

Ajouter une entrée publique :

powershell -ExecutionPolicy Bypass -File .\scripts\add-public-entry.ps1

Publier JSON :

powershell -ExecutionPolicy Bypass -File .\scripts\publish-json.ps1

Restaurer dernier backup :

powershell -ExecutionPolicy Bypass -File .\scripts\restore-last-backup.ps1

Menu Clario :

powershell -ExecutionPolicy Bypass -File .\scripts\clario-menu.ps1

## Processus standard pour ajouter une formation publique

1. Identifier la formation prête.
2. Extraire uniquement les champs publics marketing.
3. Ne jamais copier le contenu pédagogique complet.
4. Valider le lien Stripe.
5. Faire un dry-run avec add-public-entry.ps1.
6. Lancer check-clario.ps1.
7. Ajouter à data/formations.json seulement après validation.
8. Lancer test-live-clario.ps1 après publication.
9. Commit/push seulement après confirmation.

## Processus standard avant publication

Toujours vérifier :
- _private_local/ ignoré ;
- aucun contenu privé dans data/formations.json ;
- liens Stripe valides ;
- slugs uniques ;
- codes uniques ;
- prix cohérents ;
- catégories officielles ;
- pages formation accessibles ;
- catalogue fonctionnel.

## Catégories officielles

- IA
- Productivité
- Apprentissage
- Business
- Finances
- Relations
- Bonheur
- Santé

## Prix autorisés

- 5 $
- 15 $
- 25 $
- 50 $
- 160 $
- 320 $

## Réponse attendue

Répondre court et opérationnel.

Toujours indiquer :
- fichiers modifiés ;
- fichiers non touchés ;
- résultat du test ;
- problème exact s’il y en a un ;
- prochaine action recommandée.

Ne pas écrire de longues explications sauf demande explicite.

# Structure du dépôt Clario

Ce document décrit l'arborescence finale du dépôt et le rôle de chaque dossier.

## Arborescence

```
clario/
├── index.html               Page d'accueil
├── formations.html          Catalogue (lit data/formations.json)
├── formation.html           Page modèle UNIQUE pour toutes les formations
├── contact.html             Formulaire de contact
├── merci.html               Page de remerciement post-achat
├── conditions.html          Conditions générales
├── confidentialite.html     Politique de confidentialité (Loi 25 + RGPD)
├── 404.html                 Page d'erreur
├── .nojekyll                Désactive le traitement Jekyll de GitHub Pages
├── README.md                Lisez-moi du dépôt
│
├── css/
│   ├── base.css             Variables, reset, header, footer, boutons
│   ├── accueil.css          Sections de la page index
│   ├── catalogue.css        Page formations.html (filtres, grille, cartes)
│   ├── formation.css        Page formation.html (hydratée par JS)
│   └── responsive.css       Adaptations tablette / mobile / impression
│
├── js/
│   ├── main.js              Init global (année footer, lien actif)
│   ├── navigation.js        Menu mobile (burger)
│   ├── catalogue.js         Lit le JSON, filtre, rend la grille
│   └── formation-loader.js  Lit ?id=, hydrate formation.html depuis le JSON
│
├── data/
│   ├── formations.json      Source unique des formations (UN fichier pour tout)
│   ├── categories.json      8 catégories officielles + préfixes
│   └── prix.json            6 paliers de prix officiels
│
├── assets/
│   ├── logo/                Logos PNG / SVG
│   ├── images/formations/   Une image par formation (optionnel : ID-XXX.png)
│   └── icons/               Favicon et icônes
│
├── templates/
│   ├── modele-formation.html    Référence visuelle de la fiche
│   ├── modele-description.md    Squelette de description longue
│   └── modele-checklist.md      Standard de checklist
│
├── docs/
│   ├── roadmap.md               Plan de développement
│   ├── idees-formations.md      Liste des 400 IDs réservés
│   ├── structure-depot.md       Ce document
│   └── guide-ajout-formation.md Procédure pour ajouter une formation
│
├── dashboard/
│   └── index.html               Tableau de bord interne (non indexé)
│
├── _archive/                    Anciens fichiers (hors GitHub Pages public)
└── _prompts/                    Prompts maîtres Clario (référence privée)
```

## Règle d'or

> Le design ne change pas. La page ne change pas. Seul l'ID change.
> Le contenu de chaque formation vient de `data/formations.json`.

## Fichiers à NE PAS dupliquer

- Une seule page `formation.html` pour les 400 formations.
- Une seule source de données : `data/formations.json` (au début).
- Une seule feuille de style par module (pas de CSS dupliqué).

## Quand séparer `formations.json`

Garde un seul fichier tant qu'il est gérable. Quand tu dépasses environ
~1500 lignes ou que tu as plus de 100 formations, divise par catégorie :

```
data/formations/
├── ia.json
├── productivite.json
├── apprentissage.json
├── business.json
├── finances.json
├── relations.json
├── bonheur.json
└── sante.json
```

À ce moment-là, `js/catalogue.js` sera mis à jour pour faire 8 fetch en parallèle
et fusionner les résultats.

## Dossiers spéciaux préfixés `_`

- `_archive/` : anciens fichiers de développement, conservés pour référence.
- `_prompts/` : prompts maîtres Clario (5 $, 15 $, 25 $, 50 $, 160 $, 320 $).

Ces dossiers **ne doivent pas être déployés** sur GitHub Pages public.
Tu peux les exclure via `.gitignore` ou les laisser dans le dépôt privé seulement.

# Clario

Site de mini-formations digitales à achat unique.

## Aperçu

- **Page d'accueil** : `index.html`
- **Catalogue** : `formations.html`
- **Fiche de formation** (générique) : `formation.html?id=ID-DE-LA-FORMATION`
- **Source de données** : `data/formations.json`

## Règle d'or

> Le design ne change pas. La page ne change pas. Seul l'ID change.
> Le contenu de chaque formation vient de `data/formations.json`.

Une seule page `formation.html` sert pour les 400 formations.

## Lancer en local

```bash
python3 -m http.server 8000
```

Puis ouvre `http://localhost:8000/`.

## Déploiement GitHub Pages

1. Pousse le dépôt sur GitHub (nom recommandé : `clario`).
2. Active GitHub Pages dans `Settings → Pages` sur la branche `main`, dossier `/ (root)`.
3. Le fichier `.nojekyll` désactive le traitement Jekyll.
4. Ton site est en ligne sous `https://[user].github.io/clario/`.

## Structure

Voir `docs/structure-depot.md` pour l'arborescence complète et le rôle
de chaque dossier.

## Ajouter une formation

Voir `docs/guide-ajout-formation.md` pour la procédure pas à pas.

## Roadmap

Voir `docs/roadmap.md` pour le plan de développement progressif.

## Catégories officielles

| Code | Préfixe slug | Nom            |
|------|--------------|----------------|
| IA   | `ia-`        | IA             |
| PROD | `pro-`       | Productivité   |
| APP  | `app-`       | Apprentissage  |
| BUS  | `bus-`       | Business       |
| FIN  | `fin-`       | Finances       |
| REL  | `rel-`       | Relations      |
| BON  | `bon-`       | Bonheur        |
| SAN  | `san-`       | Santé          |

## Contact

lepivotdor@gmail.com

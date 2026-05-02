# Guide — Ajouter une nouvelle formation

Procédure pas à pas pour ajouter une formation au catalogue Clario.

## 1. Générer le contenu via le bon prompt maître

Dans `_prompts/`, choisis le prompt selon le prix visé :

| Prix    | Fichier prompt                                              |
|---------|-------------------------------------------------------------|
| 5 $     | `Clario_prompt_maitre_formation_5_dollars_V5_corrige.txt`   |
| 15 $    | `Clario_prompt_maitre_formation_15_dollars_V5_corrige.txt`  |
| 25 $    | `Clario_prompt_maitre_formation_25_dollars_V5_corrige.txt`  |
| 50 $    | `Clario_prompt_maitre_formation_50_dollars_V5_corrige.txt`  |
| 160 $   | `Clario_prompt_maitre_formation_160_dollars_V5_corrige.txt` |
| 320 $   | `Clario_prompt_formation_320_dollars_PROMPT_A_...` + B      |

Colle le prompt dans Manus / Claude / ChatGPT et remplace
`TITRE_DE_LA_FORMATION = "..."` par ton idée. Récupère :

1. La **PARTIE 1** (formation client complète, en texte).
2. La **PARTIE 2** (fiches internes).
3. Le **JSON CATALOGUE OBLIGATOIRE**.

## 2. Choisir l'ID définitif

Vérifie dans `docs/idees-formations.md` la prochaine place libre dans
la catégorie. Exemple : si IA-001 à IA-007 sont publiées, ta nouvelle
formation prend IA-008.

- **Code** : `IA-008` (etc.)
- **ID = slug** : `ia-titre-court-en-tirets` (ASCII minuscule + tirets, ≤ 60 car.)

Le préfixe du slug doit toujours être l'un des 8 officiels :
`ia-`, `pro-`, `app-`, `bus-`, `fin-`, `rel-`, `bon-`, `san-`.

## 3. Ouvrir `data/formations.json`

Ajoute un nouvel objet dans le tableau JSON (avant le crochet final `]`).

Champs obligatoires :

```json
{
  "id": "ia-titre-court",
  "code": "IA-008",
  "titre": "...",
  "slug": "ia-titre-court",
  "url": "formation.html?id=ia-titre-court",
  "fichier_html": "formation.html",
  "categorie": "IA",
  "prix_affiche": "5 $",
  "prix_numerique": 5,
  "type": "mini-formation",
  "niveau": "micro",
  "public_cible": "...",
  "resume_court": "... (≤ 220 car.)",
  "sous_titre": "... (≤ 90 car.)",
  "promesse": "... (≤ 140 car.)",
  "resultat_concret": "...",
  "resultat_attendu": "...",
  "resultat_periode": "24 à 72 heures",
  "duree_estimee": "10 à 20 minutes",
  "statut": "publié",
  "version": "1.0",
  "date_creation": "AAAA-MM-JJ",
  "derniere_mise_a_jour": "AAAA-MM-JJ",
  "prochaine_mise_a_jour": "AAAA-MM-JJ (+1 an)",
  "formation_suivante": "...",
  "prix_formation_suivante": 15,
  "note_qualite": 92,
  "note_rentabilite": 90,
  "note_valeur_client": 92,
  "note_simplicite": 95,
  "note_integration_web": 95,
  "priorite_catalogue": "moyenne",
  "potentiel_vente": "moyen",
  "bouton_cta": "Acheter pour 5 $",
  "tags": ["mot1", "mot2", "mot3", "mot4", "mot5"],
  "detail": {
    "introduction": "...",
    "resultat_vise": "...",
    "demarrage_rapide": "...",
    "avant_apres": { "avant": "...", "apres": "..." },
    "methode": [
      { "titre": "...", "objectif": "...", "explication": "...", "action": "...", "resultat": "..." }
    ],
    "exemple": "...",
    "outil": { "titre": "...", "description": "...", "contenu": "..." },
    "checklist": ["Action 1", "Action 2"],
    "plan_action": "...",
    "erreurs_a_eviter": [
      { "erreur": "...", "risque": "...", "correction": "..." }
    ],
    "bilan": ["Question 1", "Question 2"],
    "conclusion": "..."
  }
}
```

## 4. Vérifications avant publication

- [ ] Validité du JSON (aucune virgule finale, aucun emoji dans le JSON).
- [ ] `id` et `slug` identiques, ≤ 60 caractères, ASCII minuscule.
- [ ] `prix_affiche` cohérent avec `prix_numerique` (5 $ ↔ 5).
- [ ] `prix_affiche` utilise une espace insécable U+00A0 entre le nombre et `$`.
- [ ] 5 à 10 tags, sans doublon, sans accent, sans `#`.
- [ ] Tutoiement partout, jamais "vous".
- [ ] Aucune mention de l'ancien nom de marque.
- [ ] Phrase obligatoire de prix présente exactement une fois (dans la conclusion).
- [ ] Statut = `publié` quand prête à montrer, sinon `brouillon`.

## 5. Tester localement

```
python3 -m http.server 8000
```

Puis dans le navigateur :

- `http://localhost:8000/formations.html` — la nouvelle carte doit apparaître.
- `http://localhost:8000/formation.html?id=ia-titre-court` — la fiche doit s'afficher.
- `http://localhost:8000/dashboard/` — le tableau de bord doit la lister.

## 6. Pousser sur GitHub

```
git add data/formations.json
git commit -m "Ajout formation IA-008"
git push
```

GitHub Pages déploie automatiquement. La nouvelle formation est en ligne
sous 1 à 2 minutes.

## 7. (Optionnel) Image dédiée

Si tu veux une image personnalisée pour cette formation :

- Place-la dans `assets/images/formations/IA-008.png` (1200x800 px recommandé).
- Le code peut la référencer plus tard via `assets/images/formations/[CODE].png`.

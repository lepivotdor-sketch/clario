# Roadmap Clario

Plan progressif pour passer de 0 à 400 formations sans casser la structure.

## Étape 1 — Base minimale ✅ (1 mai 2026)

- [x] Arborescence complète (css/, js/, data/, assets/, templates/, docs/, dashboard/)
- [x] index.html, formations.html, formation.html, contact.html, merci.html
- [x] conditions.html, confidentialite.html, 404.html
- [x] Tableau de bord interne (dashboard/)
- [x] data/formations.json + categories.json + prix.json
- [x] Catalogue dynamique (filtres, recherche)
- [x] Page formation hydratée par ID
- [x] 8 formations de démarrage (1 par catégorie, 5 $)
- [x] .nojekyll pour GitHub Pages

## Étape 2 — Premier déploiement (semaine 1-2)

- [ ] Créer le dépôt GitHub `clario` et y pousser ce dossier.
- [ ] Activer GitHub Pages sur la branche `main`.
- [ ] Vérifier le rendu en ligne (URL `https://[user].github.io/clario/`).
- [ ] Acheter et brancher un nom de domaine si souhaité (DNS CNAME → GitHub Pages).
- [ ] Tester sur 3 navigateurs (Chrome, Firefox, Safari) et sur mobile.

## Étape 3 — 50 formations (mois 1-2)

- [ ] Compléter chaque catégorie à 5 ou 6 formations.
- [ ] Ajouter des images dédiées dans `assets/images/formations/`.
- [ ] Brancher un système de paiement (Stripe, Gumroad, Lemon Squeezy).
- [ ] Mettre à jour le bouton CTA pour pointer vers le système de paiement réel.
- [ ] Intégrer un courriel automatique post-achat.

## Étape 4 — 100 formations (mois 3-4)

- [ ] 12 à 13 formations par catégorie.
- [ ] Vérifier que `data/formations.json` reste lisible (sinon, prévoir la séparation).
- [ ] Surveiller les performances de chargement du catalogue.

## Étape 5 — 200 formations (mois 5-7)

- [ ] Diviser `data/formations.json` en 8 fichiers par catégorie.
- [ ] Mettre à jour `js/catalogue.js` pour fetch en parallèle.
- [ ] Ajouter une page par catégorie (optionnel : `formations.html?cat=ia`).
- [ ] Système de tri (par date, popularité, prix croissant/décroissant).

## Étape 6 — 400 formations (objectif final)

- [ ] 50 formations par catégorie.
- [ ] Système de recommandations (formations similaires, formation suivante).
- [ ] Page de "bundles" (achat groupé par catégorie).
- [ ] Optionnel : connexion utilisateur pour retrouver les achats passés.

## Règles de progression

1. **Ne jamais casser le design** : ne touche pas aux fichiers CSS de structure
   sans tester sur 3 formations différentes.
2. **Toujours valider le JSON** avant de pousser : `python3 -c "import json; json.load(open('data/formations.json'))"`.
3. **Sauvegarder avant restructuration** : copier dans `_archive/` si on change l'arborescence.
4. **Une seule formation par session de génération** au début pour bien valider la qualité.
5. **Lever le statut à `publié` en dernier** : commencer en `brouillon` pour tester l'affichage.

## Indicateurs à suivre

- Nombre de formations par catégorie (objectif équilibré).
- Note qualité moyenne (cible : ≥ 90/100).
- Vitesse de chargement du catalogue (< 1 seconde sur 4G).
- Taux de conversion catalogue → fiche → achat.

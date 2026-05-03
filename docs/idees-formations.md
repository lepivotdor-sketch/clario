# Idées de formations — convention de nommage

Plan général : 8 catégories de 50 IDs réservés (400 slots au total).
Chaque ID suit le format `<prefixe>-<numero>` : par exemple `IA-001`, `BUS-007`.

## Préfixes par catégorie

- `IA-XXX` : IA et automatisation
- `PROD-XXX` : Productivité
- `APP-XXX` : Apprentissage
- `BUS-XXX` : Business
- `FIN-XXX` : Finances
- `REL-XXX` : Relations
- `BON-XXX` : Bonheur
- `SAN-XXX` : Santé

## Source de vérité publique

Les formations effectivement publiées et en vente sont listées dans
`data/formations.json`. Ce fichier ne contient que des champs de vente
(titre, résumé, promesse, prix, public, durée, etc.). Le contenu
pédagogique complet n'est jamais stocké dans le dépôt public —
voir `docs/securite-contenu-prive.md`.

## Roadmap interne

Le détail des formations en préparation (titres, contenus, planification)
est conservé hors du dépôt public.

# Politique de sécurité — Clario

## Statut du projet

Clario est un site statique publié avec GitHub Pages.

Le site ne doit pas contenir de données sensibles, de mots de passe, de clés API privées, de secrets Stripe, de données clients confidentielles ou de contenu payant complet directement dans le dépôt public.

## Règles de sécurité importantes

### 1. Ne jamais publier de secrets

Ne jamais mettre dans le code public :

- Clés secrètes Stripe
- Mots de passe
- Identifiants personnels
- Données clients
- Numéros de téléphone privés
- Adresses privées
- Liens privés vers des fichiers payants
- Informations bancaires
- Jetons API
- Clés d’accès
- Données fiscales ou légales sensibles

### 2. Stripe

Les paiements doivent utiliser uniquement des liens Stripe sécurisés ou une intégration Stripe officielle.

Le site public peut contenir :

- Des boutons d’achat
- Des liens Stripe publics
- Des pages de présentation
- Une page de remerciement

Le site public ne doit jamais contenir :

- La clé secrète Stripe
- Une logique de validation de paiement privée
- Une liste complète des clients
- Des accès payants non protégés

### 3. Formations payantes

Les pages publiques peuvent présenter les formations, mais elles ne doivent pas afficher le contenu complet réservé aux clients.

Le contenu payant complet doit être protégé ou livré après achat par un système approprié.

### 4. Données publiques

Les fichiers JSON publics comme `data/formations.json` doivent contenir seulement des informations de présentation :

- Titre
- Catégorie
- Prix
- Description
- Résumé
- Bénéfices
- Lien d’achat public
- Statut public

Ils ne doivent pas contenir :

- Contenu complet de formation
- Accès privé
- Emails clients
- Données personnelles
- Secrets techniques

### 5. Tableau de bord caché

Un tableau de bord caché sur un site statique ne doit pas être considéré comme sécurisé.

Même s’il est caché par un bouton, un cadenas ou une URL difficile à deviner, son contenu peut être accessible publiquement si le fichier est dans GitHub Pages.

Le tableau de bord caché peut contenir seulement des données non sensibles, par exemple :

- Nombre de formations prévues
- Statuts internes non critiques
- Notes de qualité
- Notes de rentabilité approximatives
- Priorités de création
- Dates de mise à jour

Il ne doit pas contenir :

- Revenus réels détaillés
- Informations clients
- Données de paiement
- Accès privés
- Secrets Stripe
- Informations personnelles sensibles

## Signalement d’un problème de sécurité

Si un problème de sécurité est découvert, il doit être corrigé immédiatement avant d’ajouter de nouvelles fonctionnalités.

Priorité de correction :

1. Retirer le secret ou l’information sensible du dépôt.
2. Remplacer les clés ou accès compromis.
3. Vérifier que le site public ne montre plus l’information.
4. Faire un nouveau commit propre.
5. Tester le site en ligne.

## Bonnes pratiques avant chaque commit

Avant chaque commit, vérifier :

- Aucun mot de passe dans le code
- Aucune clé Stripe secrète
- Aucun contenu payant complet visible publiquement
- Aucun fichier client privé
- Aucun lien privé sensible
- Aucun ancien nom d’entreprise à remplacer
- Aucun fichier inutile ou test dangereux
- Aucun doublon majeur
- Aucun fichier JSON invalide

## Bonnes pratiques avant chaque déploiement

Avant de publier une nouvelle version :

- Tester l’accueil
- Tester le catalogue
- Tester une fiche de formation
- Tester les boutons d’achat
- Tester la page de remerciement
- Vérifier l’affichage mobile
- Vérifier que les fichiers JSON se chargent bien
- Vérifier que les pages privées ne contiennent rien de sensible

## Versions supportées

Le projet étant en développement actif, seule la version la plus récente du site est supportée.

Les anciennes versions ne sont pas maintenues.

## Note importante

La sécurité complète des paiements, des accès clients et du contenu payant ne doit pas dépendre uniquement de GitHub Pages.

Pour une vraie protection des accès clients, il faudra éventuellement utiliser une solution avec authentification, serveur, base de données ou plateforme de livraison sécurisée.

# Modèle de données

Ce document décrit le contrat métier. Les noms SQL exacts peuvent suivre les conventions Drizzle établies au plan 002, mais les relations et invariants ne doivent pas changer sans ADR ou mise à jour explicite de ce document.

## Auteurs

### `authors`

| Champ | Règle |
|---|---|
| `id` | UUID/ULID généré par l'application |
| `email` | unique, privé, normalisé en minuscules ; correspond au JWT Access |
| `role` | `admin` ou `author` |
| `status` | `active` ou `disabled` |
| `slug` | unique, public et éditable |
| `firstName`, `lastName` | requis dans l'admin |
| `displayName` | pseudo public requis |
| `bio` | Markdown limité au texte et aux liens, sans embed |
| `avatarMediaId` | asset image facultatif |
| `publicEmail` | facultatif et distinct de l'e-mail de connexion |
| `createdAt`, `updatedAt` | timestamps UTC |

Les liens sociaux sont stockés dans `author_social_links` avec `authorId`, fournisseur, libellé, URL et ordre. Aucune date de naissance n'est collectée.

## Publications

### `articles`

| Champ | Règle |
|---|---|
| `id` | identifiant stable |
| `type` | `review`, `first_impression` ou `article` |
| `status` | `draft` ou `published` |
| `authorId` | auteur propriétaire requis |
| `title` | requis, longueur bornée |
| `slug` | unique, éditable, normalisé |
| `excerpt` | chapô requis avant publication |
| `bodyMarkdown` | Markdown source requis avant publication |
| `heroMediaId` | image requise avant publication |
| `scoreHalfSteps` | `null` ou entier de 0 à 20 ; affichage `valeur / 2` sur 10 |
| `verdict` | requis si `scoreHalfSteps` n'est pas `null` |
| `featured` | booléen ; au plus un contenu mis en avant par requête métier |
| `finalReviewId` | uniquement pour `first_impression`, vers une review publiée du même jeu |
| `hasMaterialBenefit` | vrai si jeu, voyage ou autre avantage a été fourni à l'auteur |
| `disclosure` | texte facultatif, requis lorsqu'un avantage matériel existe |
| `publishedAt` | `null` avant toute publication ; fixé à la première publication et conservé après dépublication |
| `createdAt`, `updatedAt` | timestamps UTC |

Invariants :

- une `review` possède exactement un jeu principal ;
- une `first_impression` possède exactement un jeu principal et aucune note ;
- un `article` possède zéro à plusieurs jeux et aucune note ;
- toute note est un demi-point valide et implique un verdict ;
- seul un article publié peut être référencé par `finalReviewId` ;
- `hasMaterialBenefit=true` ou au moins un lien affilié exige une `disclosure` non vide ;
- une publication exige un auteur actif au moment de l'action, une couverture valide, un titre, un chapô et un corps non vide ; désactiver ensuite son accès ne dépublie pas son fonds.

`article_games` porte `articleId`, `gameId`, `isPrimary` et garantit un seul jeu principal par publication. `article_tags` gère les tags. `article_links` stocke les liens propres au contenu : fournisseur, libellé, URL, `isAffiliate` et ordre.

### `article_slug_redirects`

Stocke chaque ancien slug public, l'article cible et sa date de création. Un ancien slug ne peut pas redevenir le slug actif d'un autre article. La route publique répond par une redirection permanente vers le slug courant.

## Jeux et taxonomies

### `games`

- `id`, `title`, `slug` unique ;
- `coverMediaId` facultatif ;
- développeur et éditeur facultatifs ;
- date de sortie facultative, avec précision explicite (`day`, `month`, `year` ou `unknown`) pour ne pas inventer un jour ;
- timestamps UTC.

`platforms`, `genres` et `tags` sont des tables de vocabulaire avec identifiant, nom, slug et ordre facultatif. Les relations `game_platforms` et `game_genres` rendent les filtres D1 simples et indexables.

`game_store_links` contient `gameId`, plateforme/fournisseur, libellé, URL et ordre. Le caractère affilié appartient à `article_links`, car il dépend de la publication et de sa divulgation.

## Médias

### `media_assets`

- identifiant stable et `r2Key` unique ;
- nom de fichier original uniquement pour l'admin ;
- type MIME validé, taille en octets, largeur et hauteur ;
- texte alternatif requis, légende et crédit facultatifs ;
- auteur ayant téléversé l'image et date UTC ;
- aucune URL publique persistée.

Les références structurées à un asset sont des clés étrangères. Les références présentes dans `bodyMarkdown` doivent aussi être extraites dans `article_media` lors de la sauvegarde afin de garantir l'intégrité et de détecter les assets supprimables.

## Embeds externes

### `article_embeds`

Table dérivée lors de la sauvegarde du Markdown : `articleId`, identifiant stable de directive, type (`video`/`music`), fournisseur, URL canonique et ordre. Elle sert à valider les fournisseurs, générer les placeholders et auditer les contenus tiers sans analyser tout le corpus à chaque requête.

Fournisseurs autorisés : `youtube`, `vimeo`, `spotify`, `apple_music`, `youtube_music`, `bandcamp`, `soundcloud`.

## Index minimum

- unicité sur les slugs et e-mails normalisés ;
- `articles(status, publishedAt)` pour le flux public ;
- `articles(authorId, status, updatedAt)` pour l'admin ;
- index des tables de jointure dans les deux sens ;
- recherche préfixe/partielle simple sur titres normalisés de publications, jeux et auteurs ;
- `article_slug_redirects(oldSlug)` unique.

La recherche plein texte FTS dans le corps est explicitement différée.

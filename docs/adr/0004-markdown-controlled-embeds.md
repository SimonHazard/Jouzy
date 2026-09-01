# ADR-0004 — Markdown sûr et directives d'embed contrôlées

- Statut : accepté
- Date : 2026-09-01

## Contexte

Les auteurs ont besoin d'un format durable pour le texte, les images, les vidéos et une musique associée. Un éditeur riche propriétaire rendrait le stockage plus complexe ; MDX ou HTML arbitraire permettrait d'exécuter du code ou d'injecter des éléments dangereux.

## Décision

- Le corps source est du Markdown CommonMark/GFM.
- Le HTML brut, MDX, scripts et iframes manuelles sont rejetés.
- Deux directives Jouzy existent : image par `assetId` et embed par type/fournisseur/URL.
- L'éditeur insère ces directives via des commandes ; l'auteur n'a pas à connaître leur syntaxe exacte.
- Le parseur valide et normalise les directives côté serveur à chaque sauvegarde.
- L'aperçu admin et le public utilisent le même package `packages/content`.
- Fournisseurs V1 : YouTube, Vimeo, Spotify, Apple Music, YouTube Music, Bandcamp et SoundCloud.
- Le Markdown source reste la vérité ; les tables `article_media` et `article_embeds` sont des projections d'intégrité et de requête.

## Conséquences

- Une allowlist stricte de nœuds, attributs, domaines et schémas d'URL doit être testée.
- Une URL inconnue reste un lien normal ou produit une erreur d'édition, jamais une iframe générique.
- Modifier la grammaire de directive nécessite compatibilité ascendante ou migration du corpus.
- La prévisualisation ne doit jamais diverger du rendu public.

## Alternatives écartées

- MDX : puissance inutile et exécution de composants dans du contenu non fiable.
- HTML arbitraire : surface XSS et rendu imprévisible.
- Éditeur bloc JSON complet : coût d'interface et verrouillage de format disproportionnés.
- Iframes collées librement : sécurité, confidentialité et mise en page non maîtrisées.

## Références

- [GitHub Flavored Markdown specification](https://github.github.com/gfm/)
- [ADR-0005 — confidentialité des médias externes](0005-privacy-analytics-external-media.md)

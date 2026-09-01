# ADR-0002 — Cloudflare Workers, D1 et R2 comme socle V1

- Statut : accepté
- Date : 2026-09-01

## Contexte

Le projet doit être hébergé sur Cloudflare, rester simple à opérer et supporter un corpus relationnel modeste : auteurs, articles, jeux, taxonomies et liens. Les images nécessitent un stockage objet, mais les vidéos restent externes.

Neon apporterait un Postgres complet, et Convex un backend réactif, mais chacun ajouterait un fournisseur, des secrets et une intégration réseau dont Jouzy n'a pas besoin en V1.

## Décision

- Les deux applications s'exécutent sur Cloudflare Workers.
- Cloudflare D1 est la base relationnelle unique, pilotée avec Drizzle ORM et des migrations versionnées.
- Cloudflare R2 stocke les images ; l'admin écrit via un binding Worker.
- Les images publiques sont lues sur un domaine R2 personnalisé et mis en cache par Cloudflare ; `r2.dev` est désactivé en production.
- Les clés R2 sont aléatoires et stockées en base, jamais les URL complètes.
- Aucun accès S3, URL présignée, transformation d'image ou upload vidéo n'est introduit en V1.

## Conséquences

- Le schéma doit respecter les limites et la sémantique SQLite de D1.
- Le Worker web utilise uniquement des fonctions de requête publiques et ne reçoit pas le binding R2.
- L'absence de transactions distribuées D1/R2 impose des opérations média explicites et des erreurs récupérables.
- Une migration vers Postgres reste possible si les volumes ou requêtes dépassent réellement D1, mais elle n'est pas anticipée.

## Alternatives écartées

- Neon/Postgres : capacité inutile et fournisseur supplémentaire au lancement.
- Convex : modèle et runtime supplémentaires pour un site essentiellement éditorial.
- Images en base ou dans le dépôt : mauvais cycle de déploiement et limites de taille.
- Cloudflare Images : transformations et coût non requis par la V1.

## Références

- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/)
- [R2 public buckets and custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Cloudflare cache and R2](https://developers.cloudflare.com/cache/interaction-cloudflare-products/r2/)

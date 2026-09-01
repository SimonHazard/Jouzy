# ADR-0006 — Better-T-Stack pour le scaffold, Wrangler pour Cloudflare

- Statut : accepté
- Date : 2026-09-01

## Contexte

Le projet doit être initialisé avec Better-T-Stack et déployé sur Cloudflare. Le guide Cloudflare de Better-T-Stack s'appuie actuellement sur Alchemy v2 beta et une version candidate d'Effect. Cette couche peut provisionner toute l'infrastructure, mais elle élargit fortement le socle à maintenir pour deux Workers, une D1 et un bucket R2.

Cloudflare documente directement TanStack Start avec son plugin Vite et Wrangler. D1, R2, variables, types et déploiements sont couverts sans infrastructure-as-code supplémentaire.

## Décision

- Better-T-Stack sert une seule fois à générer le socle Bun/TypeScript/TanStack Start/Drizzle et les conventions du monorepo.
- Le scaffold est d'abord exécuté en mode dry-run/JSON dans un répertoire temporaire, puis contrôlé avant intégration afin de préserver la documentation existante.
- La cible Cloudflare n'est pas générée avec Alchemy.
- Chaque application utilise `@cloudflare/vite-plugin`, `wrangler.jsonc` et les bindings officiels.
- Les ressources sont provisionnées manuellement pour la V1 ; leurs identifiants sont injectés selon `docs/ENVIRONMENT.md`.
- Les versions exactes sont épinglées par le lockfile et vérifiées au moment du scaffold, pas inscrites durablement dans cet ADR.

## Conséquences

- Le dépôt bénéficie du scaffold demandé sans conserver une abstraction d'infrastructure beta.
- Le provisionnement manuel doit être documenté et rejouable.
- Une future CI/CD ou infrastructure-as-code pourra adopter Wrangler, Terraform, Pulumi ou Alchemy dans un nouvel ADR après évaluation à ce moment-là.
- Le plan 001 doit arrêter l'exécution si Better-T-Stack ne permet plus d'obtenir la structure attendue sans Alchemy.

## Alternatives écartées

- Alchemy v2 beta en V1 : dépendances et modèle opérationnel trop larges pour le besoin.
- Ne pas utiliser Better-T-Stack : contraire au choix explicite du projet.
- Cloudflare Pages : TanStack Start est ciblé ici comme Worker full-stack avec bindings.

## Références

- [Better-T-Stack quick start](https://www.better-t-stack.dev/docs)
- [Better-T-Stack CLI agent workflows](https://www.better-t-stack.dev/docs/cli/agent-workflows)
- [Better-T-Stack Cloudflare/Alchemy guide](https://www.better-t-stack.dev/docs/guides/cloudflare-alchemy)
- [Cloudflare guide for TanStack Start](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/)

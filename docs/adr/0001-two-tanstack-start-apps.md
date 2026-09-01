# ADR-0001 — Deux applications TanStack Start sans API séparée

- Statut : accepté
- Date : 2026-09-01

## Contexte

Jouzy a deux surfaces aux contraintes différentes : un site public anonyme et un back-office protégé. Elles partagent le modèle, le rendu éditorial et le design, mais l'admin possède des mutations et un accès R2 que le site public ne doit pas recevoir.

Créer une troisième application API ajouterait un déploiement, un contrat réseau et une couche d'authentification service-à-service sans besoin V1. À l'inverse, fusionner public et admin dans un seul Worker élargirait inutilement les bindings et le périmètre protégé.

## Décision

- Un monorepo Bun/TypeScript contient `apps/web` et `apps/admin`.
- Les deux sont des applications TanStack Start et des Workers Cloudflare distincts.
- Les fonctions serveur TanStack Start accèdent directement aux bindings autorisés.
- Le code commun vit dans `packages/db`, `packages/domain`, `packages/content`, `packages/ui` et `packages/config`.
- Aucun service API autonome n'est créé en V1.
- Better-T-Stack génère le squelette monorepo et une application TanStack Start de référence ; le plan de scaffold normalise ensuite une seconde application selon le même modèle, car le CLI ne sélectionne qu'un frontend par génération.

## Conséquences

- Le site public ne reçoit pas de binding R2 d'écriture ni de code de mutation exposé.
- Les deux Workers doivent rester compatibles avec les paquets partagés et le runtime Workers.
- Les migrations D1 sont uniques et lancées depuis la racine, pas par chaque application.
- Si une API publique ou un troisième client apparaît, la frontière devra être réévaluée dans un nouvel ADR.

## Alternatives écartées

- Une seule application public/admin : frontière de sécurité moins nette.
- API REST ou RPC séparée : coût opérationnel sans consommateur distinct en V1.
- CMS hébergé : ne répond pas au souhait d'un back-office maîtrisé et simple.

## Références

- [TanStack Start — Hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting)
- [Better-T-Stack — Project structure](https://www.better-t-stack.dev/docs/project-structure)
- [Better-T-Stack — Compatibility](https://www.better-t-stack.dev/docs/cli/compatibility)

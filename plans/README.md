# Plans d'implémentation

Générés avec le skill Improve le 2026-09-01 à partir du commit `dea034b`. Ils décrivent une construction greenfield : aucun code applicatif n'existait lors de la planification.

Exécuter dans l'ordre ci-dessous. Chaque agent lit son plan en entier, respecte les conditions STOP et livre **une branche, un commit et un push pour un seul plan**. Ne jamais commencer le plan suivant dans la même tâche.

## Ordre et statut

| Plan | Résultat | Priorité | Effort | Dépend de | Statut |
|---|---|---:|---:|---:|---|
| [001](001-scaffold-monorepo.md) | Monorepo Bun avec deux apps TanStack Start et socle de vérification | P1 | L | — | DONE |
| [002](002-cloudflare-data-foundation.md) | Runtime Workers, bindings, modèle D1/Drizzle et migrations | P1 | L | 001 | DONE |
| [003](003-access-admin-reference-data.md) | Identité Access, permissions et admin des référentiels | P1 | L | 002 | DONE |
| [004](004-editorial-workflow.md) | Markdown sûr, médias R2 et cycle brouillon/publication | P1 | L | 003 | TODO |
| [005](005-public-editorial-site.md) | Accueil, lecture, auteurs, thèmes et rendu public | P1 | L | 004 | TODO |
| [006](006-discovery-seo-privacy.md) | Recherche, SEO, RSS, légal, analytics et preuve de confidentialité | P1 | L | 005 | TODO |
| [007](007-production-handoff.md) | Provisionnement vérifié, déploiement manuel et runbook | P1 | M | 006 | TODO |

Valeurs de statut : `TODO`, `IN PROGRESS`, `DONE`, `BLOCKED: <raison>` ou `REJECTED: <raison>`.

## Dépendances

```text
001 scaffold
  -> 002 données et bindings
    -> 003 identité et référentiels admin
      -> 004 chaîne éditoriale
        -> 005 expérience publique
          -> 006 découverte et confiance
            -> 007 mise en production manuelle
```

Le séquencement est volontaire : chaque livraison apporte les contrats et portes de vérification nécessaires à la suivante. Si un plan change un contrat documenté, il doit mettre les documents et ADR concernés dans son scope avant de poursuivre.

## Choix considérés puis écartés

- Neon et Convex : un fournisseur et un modèle opérationnel supplémentaires sans besoin démontré face à D1.
- API autonome : troisième déploiement inutile pour deux applications TanStack Start capables d'exécuter leurs fonctions serveur.
- Better Auth : surface d'authentification inutile pour une liste courte d'e-mails gérée par Cloudflare Access.
- PostHog et gestionnaire global de consentement : disproportionnés tant que Web Analytics reste l'unique mesure et que les embeds tiers sont bloqués par élément.
- Alchemy en V1 : le chemin Better-T-Stack actuel utilise une couche beta ; Wrangler et le plugin Vite Cloudflare suffisent.
- Payload et Outstatic : CMS/backends alternatifs qui dupliqueraient le back-office TanStack Start décidé.
- Animate UI, Rare UI, React Bits, Evil Buttons et autres registres animés de la veille Notion : différés ; la V1 utilise uniquement les composants shadcn/ui classiques.
- Upload vidéo, Cloudflare Images, recherche FTS, planification, versions et workflow d'approbation : valeur insuffisante pour le lancement ; réévaluer après usage réel.
- CI/CD : explicitement différée. Le plan 007 documente seulement un déploiement manuel reproductible.

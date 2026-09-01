# Plan 002 : Installer le modèle D1/Drizzle et les bindings Cloudflare

> **Instructions exécuteur** : suivre ce plan sans commencer l'admin ni les pages publiques. Lire `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/ENVIRONMENT.md`, ADR-0002 et ADR-0006. Exécuter chaque vérification. En cas de décalage structurel ou d'une condition STOP, rapporter les faits sans choisir une autre base ou architecture. À la fin, modifier uniquement la ligne 002 de `plans/README.md`.
>
> **Drift check — à lancer en premier** : `git diff --stat dea034b..HEAD -- package.json bun.lock drizzle.config.ts apps/web apps/admin packages/db packages/domain scripts .env.example`
> Les ajouts du plan 001 sont attendus. Comparer leur structure à « État actuel » ; si les chemins, scripts ou runtimes diffèrent, STOP avant de créer le schéma.

## Statut

- **Priorité** : P1
- **Effort** : L
- **Risque** : HIGH
- **Dépend de** : `plans/001-scaffold-monorepo.md`
- **Catégorie** : migration / architecture / tests
- **Planifié à** : commit `dea034b`, 2026-09-01

## Pourquoi

Tous les contenus, permissions et parcours reposent sur un contrat de données cohérent. Ce plan crée ce contrat une seule fois, avec des migrations D1 reproductibles, des validations métier indépendantes du framework et des bindings Workers typés. Il ne construit aucune interface afin que les plans suivants puissent s'appuyer sur une base vérifiée plutôt que faire évoluer le schéma au fil des écrans.

## État actuel attendu après le plan 001

- `apps/web` et `apps/admin` sont deux applications TanStack Start configurées avec `@cloudflare/vite-plugin` et Wrangler.
- `packages/db` et `packages/domain` sont des squelettes importables sans tables ni logique.
- Les scripts racine `lint`, `typecheck`, `test`, `build`, `cf:typegen` et `check` sortent 0.
- Aucun binding D1/R2, migration ou accès distant n'existe.
- `.env.example` contient les noms listés dans `docs/ENVIRONMENT.md`, sans secret réel.

Contrats à implémenter exactement :

- D1/SQLite avec Drizzle ; identifiants texte générés par l'application ; timestamps UTC en millisecondes ;
- statuts d'article limités à `draft`/`published`, rôles à `admin`/`author` ;
- score stocké en demi-points entiers de 0 à 20 ;
- relations normalisées pour plateformes, genres, tags, jeux, médias, embeds et redirections ;
- aucune URL R2 complète persistée ;
- aucune requête métier directement dans une route applicative.

## Commandes nécessaires

| But | Commande | Résultat attendu |
|---|---|---|
| Installation | `bun install` | exit 0 |
| Génération migration | `bun run db:generate` | exit 0 ; migration SQL déterministe créée |
| Migration locale | `bun run db:migrate:local` | exit 0 ; toutes migrations appliquées |
| Contrôle schéma | `bun run db:check:local` | exit 0 ; tables/index attendus présents |
| Types Workers | `bun run cf:typegen` | exit 0 ; bindings `DB` et `MEDIA` typés comme prévu |
| Tests ciblés | `bun run test -- packages/domain packages/db` | exit 0 |
| Vérification globale | `bun run check` | exit 0 |

## Outils conseillés

- Utiliser les skills `cloudflare`, `workers-best-practices` et `wrangler` si disponibles avant de modifier les configs Workers.
- Consulter [D1](https://developers.cloudflare.com/d1/), [Drizzle avec D1](https://orm.drizzle.team/docs/connect-cloudflare-d1), [bindings R2](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/) et [variables Workers](https://developers.cloudflare.com/workers/configuration/environment-variables/).
- Ne pas appeler l'API Cloudflare ni créer de ressource distante dans ce plan.

## Scope

**Dans le scope** :

- `package.json`, `bun.lock`, `drizzle.config.ts` ;
- `packages/db/**`, `packages/domain/**` ;
- `apps/web/wrangler.jsonc`, `apps/admin/wrangler.jsonc` et les fichiers de types Workers générés ;
- adaptateurs de binding strictement nécessaires sous `apps/*/src/server/db.ts` ;
- `scripts/check-local-d1.ts` si un contrôle via script est nécessaire ;
- `.env.example` seulement si le CLI impose un nom de variable supplémentaire non secret ;
- la ligne 002 de `plans/README.md`.

**Hors scope** :

- routes UI, composants, dashboard ou formulaires ;
- validation JWT Access et identité locale ;
- upload effectif R2 et parseur Markdown ;
- requêtes de recherche/flux public ;
- ressource Cloudflare distante, domaine, politique Access, analytics ou déploiement ;
- `.env` et toute valeur réelle ;
- modification des contrats produit sans nouvel ADR.

## Workflow Git

- Partir de la branche/commit livré par le plan 001 et créer `codex/002-cloudflare-data-foundation`.
- Un seul commit : `plan(002): add the Cloudflare data foundation`.
- Pousser la branche après toutes les vérifications.
- Ne pas ouvrir de PR, fusionner, déployer ou commencer le plan 003.

## Étapes

### 1. Ajouter Drizzle et le contrat de configuration

Installer les versions courantes compatibles Workers de `drizzle-orm`, `drizzle-kit` et `zod` avec Bun. Configurer `drizzle.config.ts` pour le dialecte SQLite, le schéma `packages/db/src/schema/index.ts` et la sortie `packages/db/migrations` ; la génération ne doit exiger aucune connexion distante.

Ajouter les scripts racine :

- `db:generate` — `drizzle-kit generate` ;
- `db:migrate:local` — applique les migrations avec Wrangler et la config admin en mode local ;
- `db:check:local` — vérifie tables, index et version de migration sans afficher de variable d'environnement.

Établir dans `packages/db/src/types.ts` les alias communs : identifiant texte, timestamp UTC millisecondes et type de transaction D1. Utiliser `crypto.randomUUID()` dans une factory de `packages/domain`, jamais un default SQL dépendant d'une extension.

**Vérifier** : `bun run typecheck` sort 0 avant même la création des tables ; `bun run db:generate` échoue clairement si le schéma est vide, puis devra sortir 0 à l'étape 3.

### 2. Implémenter les schémas et invariants de domaine

Dans `packages/domain/src`, créer des enums/schémas Zod et fonctions pures pour :

- rôles/statuts auteur ; types/statuts de publication ; précision de date de sortie ; types/fournisseurs d'embed ;
- normalisation e-mail, slug et texte de recherche ;
- score demi-point : `null` ou entier 0–20 ; verdict requis si score présent ;
- règles par format : jeu principal obligatoire pour review/premières impressions, score interdit ailleurs, review finale publiée du même jeu ;
- validation d'URL `https:` et allowlist de fournisseurs ;
- validation de publication : titre, chapô, corps, auteur actif, couverture et divulgation obligatoire si `hasMaterialBenefit=true` ou si un lien est affilié.

Les règles n'importent ni Drizzle, ni React, ni API Cloudflare. Exporter des erreurs structurées avec code stable et message français, pas des booléens ambigus.

**Vérifier** : tests unitaires couvrant chaque invariant et chaque valeur limite ; `bun run test -- packages/domain` sort 0.

### 3. Créer le schéma Drizzle complet

Créer des fichiers de schéma par domaine et les réexporter depuis `packages/db/src/schema/index.ts`. Utiliser des noms SQL `snake_case`, des noms TypeScript cohérents et des clés étrangères explicites.

Tables obligatoires :

- `authors`, `author_social_links` ;
- `articles`, `article_slug_redirects`, `article_games`, `article_tags`, `article_links` ;
- `games`, `game_store_links` ;
- `platforms`, `genres`, `tags`, `game_platforms`, `game_genres` ;
- `media_assets`, `article_media`, `article_embeds`.

Implémenter les champs et relations de `docs/DATA_MODEL.md`. Ajouter au minimum les index suivants : `articles(status, published_at)`, `articles(author_id, status, updated_at)`, unicité des slugs/e-mails normalisés, index dans les deux sens des tables de jointure et unicité de `article_slug_redirects.old_slug`.

Ne pas utiliser de colonne JSON pour plateformes/genres/tags. Ne pas ajouter FTS, version d'article ou table de session. Les règles transversales impossibles en contrainte SQLite sont appliquées dans les services transactionnels des plans suivants et testées dans le domaine.

Générer une seule migration initiale lisible. Ouvrir le SQL : aucun drop implicite, aucune table auth/session, aucune référence Postgres.

**Vérifier** : `bun run db:generate` sort 0 ; `rg -n "CREATE TABLE" packages/db/migrations` trouve toutes les tables listées ; `rg -n "DROP TABLE|postgres|session" packages/db/migrations` ne trouve rien d'inattendu.

### 4. Créer le client D1 et les frontières de requête

Dans `packages/db`, créer une factory qui reçoit explicitement un `D1Database` et retourne le client Drizzle. Aucun singleton global mutable et aucune lecture directe de `process.env`.

Créer deux namespaces d'accès :

- `queries/public` n'exporte que des lectures et ajoutera ses requêtes dans les plans 005/006 ;
- `queries/admin` contient les helpers transactionnels et ajoutera ses mutations dans les plans 003/004.

À ce stade, exporter seulement la factory, le schéma, les types et un health check `SELECT 1`. Dans chaque app, un adaptateur serveur récupère `DB` depuis le contexte Cloudflare et appelle la factory. Aucun module client React ne doit pouvoir importer ces adaptateurs serveur.

**Vérifier** : test de factory avec un stub D1 contrôlé ; `rg -n "process\.env|globalThis.*DB" packages/db apps/*/src/server/db.ts` ne trouve aucun accès implicite.

### 5. Déclarer les bindings locaux et générer les types

Dans les deux `wrangler.jsonc`, ajouter un binding D1 nommé `DB`, le nom logique `jouzy`, le répertoire de migrations partagé et un identifiant sentinelle clairement documenté qui sera remplacé au plan 007. Dans l'admin uniquement, ajouter un binding R2 nommé `MEDIA` avec un nom local stable. Ajouter les variables non secrètes `ENVIRONMENT=development` et une valeur factice de `R2_PUBLIC_BASE_URL` uniquement là où nécessaire.

Ne jamais ajouter R2 à `apps/web`. Ne jamais mettre `CLOUDFLARE_API_TOKEN`, `ACCESS_AUD` ou une valeur réelle dans Wrangler.

Exécuter le typegen et vérifier les interfaces produites : web contient `DB` mais pas `MEDIA`; admin contient les deux. Ajouter des tests de types si la génération n'est pas facilement inspectable automatiquement.

**Vérifier** : `bun run cf:typegen` sort 0 ; `rg -n "DB: D1Database" apps` trouve deux bindings ; `rg -n "MEDIA: R2Bucket" apps/web` ne trouve rien et la même commande dans `apps/admin` trouve une entrée.

### 6. Appliquer la migration localement et contrôler le schéma réel

Exécuter `bun run db:migrate:local` sur le stockage D1 local Wrangler. Le script `db:check:local` doit interroger `sqlite_master` et la table de migrations via `wrangler d1 execute ... --local --json`, analyser la structure sans imprimer de configuration et échouer si une table/index attendu manque.

Relancer la migration : elle doit être idempotente et indiquer qu'aucune migration nouvelle n'est à appliquer.

**Vérifier** : deux exécutions successives de `bun run db:migrate:local` sortent 0 ; `bun run db:check:local` sort 0 et rapporte uniquement le nombre de tables/index attendus.

### 7. Vérifier les contrats et livrer

Exécuter les tests ciblés puis toute la suite. Vérifier qu'aucun code de page ou ressource distante n'a été ajouté. Mettre la ligne 002 sur `DONE`, créer le commit unique et pousser.

**Vérifier** : `bun run cf:typegen && bun run db:migrate:local && bun run db:check:local && bun run check` sort 0 ; `git diff --check` est vide ; après commit `git status --short` est vide et la branche distante existe.

## Plan de tests

- `packages/domain/src/**/*.test.ts` : normalisation d'e-mail/slug, valeurs score -1/0/20/21 et non-entier, verdict, formats, jeu principal, URL et fournisseurs.
- `packages/db/src/schema/schema.test.ts` : noms de table/export, index indispensables et absence de type spécifique Postgres.
- `packages/db/src/client.test.ts` : binding requis, health check, aucune instance globale partagée.
- Smoke D1 local : migration initiale, réapplication idempotente, inventaire des tables/index.
- Test de types des bindings : web sans `MEDIA`, admin avec `MEDIA`.

Vérification finale : `bun run test -- packages/domain packages/db` puis `bun run check`, tous deux avec exit 0.

## Critères de fin

- [ ] Le schéma Drizzle couvre toutes les entités/invariants documentés, sans ajout hors V1.
- [ ] Une migration D1 initiale lisible et idempotente est versionnée.
- [ ] Les fonctions de domaine sont pures et testées aux limites.
- [ ] Le client DB reçoit explicitement le binding et ne lit aucun environnement global.
- [ ] Les bindings Workers sont typés ; le web n'a jamais accès à R2.
- [ ] `bun run db:migrate:local` et `bun run db:check:local` sortent 0 deux fois de suite.
- [ ] `bun run cf:typegen` et `bun run check` sortent 0.
- [ ] Aucun service distant, route UI, auth ou secret n'a été créé.
- [ ] Seuls les chemins du scope et la ligne 002 sont modifiés.
- [ ] Un seul commit est poussé sur `codex/002-cloudflare-data-foundation`.

## Conditions STOP

- Le plan 001 n'est pas `DONE`, ses scripts ne passent pas ou la structure diffère des chemins attendus.
- Le runtime généré ne fournit pas un contexte de binding D1 compatible avec la factory prévue.
- Drizzle ne peut pas générer/appliquer une migration D1 sans introduire un service ou dialecte différent.
- Une table/invariant documenté nécessite une décision métier non couverte par `docs/DATA_MODEL.md`.
- L'application web reçoitrait obligatoirement le binding R2 ou un secret client.
- Une migration propose de supprimer/renommer une structure déjà existante inattendue.
- Une vérification échoue deux fois ou impose un changement UI/auth/déploiement hors scope.
- Un secret réel apparaît dans un diff ou une sortie : arrêter, ne pas le recopier et demander rotation si nécessaire.

## Notes de maintenance

- Toute évolution de schéma future doit produire une nouvelle migration ; ne jamais réécrire une migration déjà appliquée en production.
- Les identifiants sentinelles Wrangler ne sont pas des secrets, mais empêchent volontairement le déploiement avant le plan 007.
- En revue, contrôler les cascades de suppression : préférer empêcher la suppression de contenus référencés plutôt qu'effacer un corpus.
- Les requêtes métier publiques/admin seront ajoutées dans leurs namespaces respectifs, jamais directement dans les routes.

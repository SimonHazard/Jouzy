# Plan 001 : Établir le monorepo Bun et ses deux applications TanStack Start

> **Instructions exécuteur** : suivre ce plan étape par étape. Exécuter chaque commande de vérification et confirmer le résultat attendu avant de poursuivre. Lire `AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/ENVIRONMENT.md`, l'ADR-0001 et l'ADR-0006 avant toute modification. Si une condition de la section « STOP » survient, s'arrêter et rapporter les faits sans improviser. À la fin, mettre à jour uniquement la ligne 001 dans `plans/README.md`.
>
> **Drift check — à lancer en premier** : `git diff --stat dea034b..HEAD -- package.json bun.lock bts.jsonc tsconfig.json biome.json .gitignore .env.example apps packages project.inlang messages scripts`
> Si un chemin d'implémentation existe ou a changé depuis la planification, comparer l'état réel à « État actuel ». Tout socle applicatif inattendu est une condition STOP.

## Statut

- **Priorité** : P1
- **Effort** : L
- **Risque** : MED
- **Dépend de** : aucun
- **Catégorie** : direction / DX / tests
- **Planifié à** : commit `dea034b`, 2026-09-01

## Pourquoi

Le dépôt ne contient encore aucun code. Ce plan doit créer une base reproductible et volontairement ennuyeuse : deux applications TanStack Start, des paquets partagés, des commandes racine stables et un test minimal par application. Tous les plans suivants supposent exactement cette structure et ne doivent pas avoir à réparer le scaffold.

## État actuel

- `README.md` décrit la cible mais ne fournit aucun script exécutable.
- `AGENTS.md` impose Bun, TypeScript strict, shadcn/ui officiel, deux Workers et « un plan, un agent, un commit, un push ».
- `docs/ARCHITECTURE.md` fixe `apps/web`, `apps/admin`, `packages/config`, `packages/content`, `packages/db`, `packages/domain` et `packages/ui`.
- Il n'existe actuellement ni `package.json`, ni `apps/`, ni `packages/`, ni lockfile, ni configuration de test. `.gitignore` protège déjà `.env` et `.env.example` contient le contrat factice à préserver.
- L'ADR-0006 exige Better-T-Stack pour la génération initiale, mais refuse sa cible Cloudflare/Alchemy ; le raccordement Workers se fait avec les outils Cloudflare officiels.
- Le scaffold ne doit jamais remplacer `README.md`, `AGENTS.md`, `docs/` ou `plans/`.

Contraintes à conserver textuellement dans l'implémentation :

- `fr` est la seule locale Paraglide V1 et les URL ne sont pas préfixées ;
- aucun backend/API autonome, auth applicative, paiement, exemple Todo/AI, Turborepo, Nx, hooks Git ou CI ;
- composants shadcn/ui classiques du registre officiel uniquement ;
- aucune valeur réelle de `.env` ne peut être lue ou écrite.

## Commandes nécessaires

| But | Commande | Résultat attendu |
|---|---|---|
| État | `git status --short --branch` | branche propre avant création ; sinon STOP si les changements touchent le scope |
| Schéma BTS | `bunx --bun create-better-t-stack@latest schema --name createInput` | exit 0 et schéma JSON lisible |
| Dry-run BTS | commande de l'étape 1 avec `"dryRun": true` | exit 0, aucun fichier du dépôt modifié |
| Installation | `bun install` | exit 0 et `bun.lock` créé |
| shadcn | `bunx --bun shadcn@latest info` | exit 0 et registre/base/icônes identifiés |
| Lint | `bun run lint` | exit 0, aucune erreur |
| Types | `bun run typecheck` | exit 0, aucune erreur |
| Tests | `bun run test` | exit 0, au moins un test par app |
| Builds | `bun run build` | exit 0 pour `web` et `admin` |
| Vérification globale | `bun run check` | exit 0 |

## Outils conseillés

- Utiliser le skill `shadcn` si disponible pour initialiser le workspace UI selon la structure générée.
- Consulter avant exécution : [workflow agent Better-T-Stack](https://www.better-t-stack.dev/docs/cli/agent-workflows), [options du CLI](https://www.better-t-stack.dev/docs/cli/options), [TanStack Start sur Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/) et [Paraglide avec TanStack Start](https://paraglidejs.com/tanstack-start).
- Utiliser `apply_patch` pour les adaptations manuelles ; le seul générateur autorisé est Better-T-Stack puis le CLI shadcn officiel.

## Scope

**Dans le scope** :

- `package.json`, `bun.lock`, `bts.jsonc`, `tsconfig.json`, `biome.json` ;
- `.gitignore`, `.env.example` ;
- `apps/web/**`, `apps/admin/**` ;
- `packages/config/**`, `packages/ui/**` ;
- squelettes sans logique dans `packages/content/**`, `packages/db/**`, `packages/domain/**` ;
- `project.inlang/**`, `messages/fr.json` ;
- `scripts/verify-env-contract.ts` ;
- la ligne 001 de `plans/README.md`.

**Hors scope** :

- contenu de `README.md`, `AGENTS.md`, `docs/**` et des ADR ;
- schéma métier Drizzle, migrations ou bindings D1/R2 (plan 002) ;
- Cloudflare Access (plan 003) ;
- routes produit, éditeur, médias, design final ou déploiement ;
- tout fichier de secret réel `.env` ;
- CI/CD, hooks Git, Docker et infrastructure-as-code.

## Workflow Git

- Créer la branche `codex/001-scaffold-monorepo` depuis l'état de base propre.
- Produire un seul commit final : `plan(001): scaffold the Jouzy monorepo`.
- Après toutes les vérifications, pousser la branche sur `origin`.
- Ne pas ouvrir de PR, fusionner, déployer ou commencer le plan 002.

## Étapes

### 1. Valider la configuration Better-T-Stack sans écrire

Exécuter l'introspection `schema --name createInput`. À partir du schéma réellement retourné, construire le payload complet ci-dessous ; seuls les noms de champs devenus obligatoires peuvent être ajoutés, avec une valeur qui conserve exactement la décision. Ne remplacer aucun choix fonctionnel.

```json
{
  "projectName": "jouzy-scaffold",
  "frontend": ["tanstack-start"],
  "backend": "self",
  "runtime": "none",
  "database": "none",
  "orm": "none",
  "api": "none",
  "auth": "none",
  "payments": "none",
  "addons": ["biome"],
  "examples": [],
  "dbSetup": "none",
  "webDeploy": "none",
  "serverDeploy": "none",
  "git": false,
  "packageManager": "bun",
  "install": false,
  "disableAnalytics": true,
  "dryRun": true
}
```

Utiliser `create-json --input '<payload>'`. Vérifier ensuite `git status --short` : il doit être inchangé.

**Vérifier** : le dry-run sort avec code 0, mentionne TanStack Start/Bun/self, et ne mentionne ni Alchemy, Cloudflare deploy, auth, API, paiement ou exemple généré.

### 2. Générer dans un répertoire temporaire puis inventorier

Créer un répertoire avec `mktemp -d`, noter son chemin exact et exécuter le même payload depuis ce répertoire avec `dryRun: false`. Ne jamais choisir le dépôt Jouzy comme cible du générateur.

Inventorier les fichiers générés avec `find <répertoire>/jouzy-scaffold -maxdepth 4 -type f | sort`. Confirmer qu'une application TanStack Start fonctionnelle, un workspace Bun et la configuration Biome sont présents. Ouvrir les configurations et vérifier qu'aucune dépendance Alchemy, auth ou API autonome n'a été ajoutée.

**Vérifier** : `test -f <répertoire>/jouzy-scaffold/package.json` et le fichier de configuration Vite de l'app TanStack Start existent ; `rg -n "alchemy|better-auth|trpc|orpc|polar" <répertoire>/jouzy-scaffold` ne retourne aucun ajout actif.

### 3. Intégrer uniquement le socle autorisé

Reproduire dans Jouzy les fichiers workspace/configuration nécessaires, sans copier le README, les instructions agent, les docs, les plans ni le `.git` généré. Conserver `bts.jsonc` comme trace reproductible et corriger son nom de projet si nécessaire.

Normaliser l'application générée en `apps/web`. Créer `apps/admin` à partir du même squelette TanStack Start, puis changer nom de package, titre, route racine et port de développement afin que les deux apps puissent tourner ensemble. Les deux pages affichent seulement un marqueur accessible « Jouzy — site public » ou « Jouzy — administration ».

Créer les paquets workspace vides mais importables `@jouzy/content`, `@jouzy/db` et `@jouzy/domain` avec un `src/index.ts` sans logique. Créer `@jouzy/config` pour les configurations partagées. Aucune table ni règle métier dans ce plan.

**Vérifier** : `find apps packages -maxdepth 3 -type f | sort` montre les deux apps et les cinq paquets ; `rg -n "TODO app|my-better|todo|alchemy" apps packages package.json bts.jsonc` ne trouve aucun résidu de template fonctionnel.

### 4. Configurer Cloudflare officiellement, sans binding métier

Dans chaque application, utiliser `@cloudflare/vite-plugin` selon le guide Cloudflare TanStack Start courant. Créer un `wrangler.jsonc` minimal avec un nom distinct, une date de compatibilité explicitement fixée au jour d'exécution et aucun binding D1/R2. Ne créer aucun package Alchemy.

Créer une commande `cf:typegen` par app et une commande racine qui lance les deux. Les types générés restent versionnés uniquement si le guide Cloudflare courant le recommande ; dans tous les cas les applications doivent compiler avec des bindings vides.

**Vérifier** : `rg -n "@cloudflare/vite-plugin" apps/*/vite.config.*` trouve les deux apps ; `rg -n "alchemy" package.json bun.lock apps packages` ne trouve rien.

### 5. Initialiser shadcn/ui comme paquet partagé

Depuis le workspace valide, exécuter `bunx --bun shadcn@latest info`. Consulter la documentation monorepo actuelle du CLI. Initialiser la configuration officielle de sorte que les composants ajoutés depuis l'une ou l'autre app soient écrits dans `packages/ui`, avec des alias TypeScript cohérents.

Ajouter seulement les composants nécessaires au socle et aux futurs formulaires : `button`, `card`, `badge`, `separator`, `skeleton`, `spinner`, `field`, `input`, `textarea`, `select`, `checkbox`, `dialog`, `sheet`, `dropdown-menu`, `table`, `tabs`, `alert`, `sonner` et `avatar`. Ne composer encore aucune page produit.

Vérifier la base sous-jacente et la bibliothèque d'icônes depuis `shadcn info` ; ne pas les supposer. Conserver les tokens shadcn sans palette finale, qui appartient au plan 005.

**Vérifier** : `bunx --bun shadcn@latest info` sort avec code 0 ; chaque composant listé existe une seule fois dans `packages/ui`; `find apps -path '*components/ui*' -type f` ne retourne aucun doublon.

### 6. Installer Paraglide en français uniquement

Initialiser Paraglide JS selon sa documentation TanStack Start courante, à la racine du monorepo. Configurer `fr` comme `baseLocale` et unique locale. Créer `messages/fr.json` avec uniquement les marqueurs d'interface des deux pages. Générer les fonctions par le plugin Vite dans chaque app ou par un package partagé, en suivant le guide monorepo officiel ; une seule source de messages doit exister.

Ne pas ajouter de sélecteur de langue ni de préfixe `/fr`. Le document `<html>` des deux apps doit rendre `lang="fr"` via le runtime Paraglide.

**Vérifier** : la compilation Paraglide sort avec code 0 ; `rg -n '"baseLocale"\s*:\s*"fr"' project.inlang` trouve une entrée ; aucune locale autre que `fr` n'est configurée.

### 7. Établir les contrats de scripts, tests et environnement

Créer les scripts racine exacts suivants :

- `lint` : Biome en mode check, sans écriture ;
- `typecheck` : TypeScript project references, sans émission ;
- `test` : Vitest en mode run ;
- `build` : build successif de `apps/web` et `apps/admin` ;
- `cf:typegen` : génération des types des deux Workers ;
- `check` : lint, typecheck, test puis build.

Ajouter un test de rendu minimal par application et un test d'import pour chaque paquet partagé. Aucun test ne contacte Internet ou Cloudflare.

Étendre `.gitignore` existant pour ignorer les sorties Vite/TanStack, couverture, fichiers locaux Wrangler et artefacts de test, sans affaiblir les règles `.env`. Conserver `.env.example` aligné exactement sur `docs/ENVIRONMENT.md`, valeurs factices uniquement. `scripts/verify-env-contract.ts` lit `.env.example`, pas `.env`, et échoue si une clé attendue manque ou si une valeur ressemble à un jeton réel.

**Vérifier** : `bun install`, puis `bun run cf:typegen`, `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build` et `bun run check` sortent tous avec code 0.

### 8. Vérifier le périmètre et livrer

Lancer `git status --short`, contrôler chaque chemin et supprimer uniquement les artefacts générés non versionnables. Mettre la ligne 001 sur `DONE`, créer le commit unique et pousser la branche.

**Vérifier** : `git diff --check` ne retourne rien ; `git status --short` est vide après commit ; `git log -1 --oneline` commence par le message demandé ; `git ls-remote --heads origin codex/001-scaffold-monorepo` retourne la branche.

## Plan de tests

- `apps/web/src/**/*.test.tsx` : rendu du marqueur public, `<html lang="fr">` et import UI partagé.
- `apps/admin/src/**/*.test.tsx` : rendu du marqueur admin et import UI partagé.
- `packages/*/src/**/*.test.ts` : chaque export racine est importable sans API Node non compatible Workers.
- `scripts/verify-env-contract.test.ts` : clé manquante rejetée, exemple factice accepté, motif de secret plausible rejeté sans afficher la valeur.
- Les tests utilisent Vitest et Testing Library si nécessaire ; copier la configuration d'un seul endroit partagé.

Vérification finale : `bun run check` sort 0 et la sortie Vitest montre au moins un fichier de test pour chaque application.

## Critères de fin

- [ ] Better-T-Stack a été exécuté en dry-run puis en génération temporaire, et `bts.jsonc` documente la provenance.
- [ ] `apps/web` et `apps/admin` buildent comme Workers TanStack Start distincts.
- [ ] Les cinq paquets partagés existent sans logique métier anticipée.
- [ ] shadcn/ui officiel est centralisé dans `packages/ui` sans composant dupliqué.
- [ ] Paraglide compile avec `fr` seule et sans préfixe de route.
- [ ] `.env.example` satisfait le contrat et `.env*` réel est ignoré.
- [ ] `bun run cf:typegen`, `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build` et `bun run check` sortent 0.
- [ ] Aucun fichier Alchemy, auth, API, paiement, exemple métier ou CI n'existe.
- [ ] Seuls les chemins du scope et la ligne 001 de l'index sont modifiés.
- [ ] Le commit unique est poussé sur la branche prévue.

## Conditions STOP

- Better-T-Stack n'accepte plus la combinaison TanStack Start + backend `self` + aucun déploiement, ou génère obligatoirement Alchemy/auth/API.
- Le scaffold généré n'est pas compatible Bun ou ne contient pas une application TanStack Start identifiable.
- Les fichiers d'architecture ou plans seraient écrasés pour intégrer le scaffold.
- Le CLI shadcn courant ne permet pas une source unique de composants partagés sans dupliquer les composants dans chaque app.
- Paraglide ne compile pas avec la version TanStack Start générée après deux tentatives raisonnables conformes à sa documentation officielle.
- Une vérification échoue deux fois, nécessite un changement hors scope ou un secret réel.
- Le worktree contient des changements utilisateur non liés dans un chemin du scope.

## Notes de maintenance

- Le lockfile est la source de versions ; ne pas figer des numéros dans les docs.
- Toute mise à jour future de Better-T-Stack doit être volontaire : ce CLI est un outil de scaffold, pas une dépendance runtime.
- En revue, vérifier particulièrement qu'aucun code Node-only n'est entré dans les apps Workers et que l'admin n'a reçu aucune auth factice hors développement.
- Le schéma D1, les bindings et les requêtes arrivent exclusivement au plan 002.

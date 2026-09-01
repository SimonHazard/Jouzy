# Plan 007 : Provisionner, déployer manuellement et remettre l'exploitation

> **Instructions exécuteur** : ce plan provoque des changements Cloudflare réels. Ne l'exécuter que si l'opérateur a explicitement demandé l'exécution du plan 007 et fourni le `.env` local. Lire `AGENTS.md`, `docs/ENVIRONMENT.md`, `docs/ARCHITECTURE.md`, tous les ADR et les pages légales produites au plan 006. Ne jamais ouvrir, afficher ou journaliser `.env`; laisser Bun/Wrangler charger ses valeurs. Vérifier chaque cible en lecture seule avant mutation. En cas de ressource/compte/valeur manquante, STOP et demander exactement l'élément manquant.
>
> **Drift check — à lancer en premier** : `git diff --stat dea034b..HEAD -- apps/web/wrangler.jsonc apps/admin/wrangler.jsonc scripts package.json .env.example docs/OPERATIONS.md`
> Les plans 001–006 doivent être `DONE` et `bun run check` doit passer avant tout appel distant. Toute autre architecture de déploiement ou CI ajoutée est une condition STOP.

## Statut

- **Priorité** : P1
- **Effort** : M
- **Risque** : HIGH
- **Dépend de** : `plans/006-discovery-seo-privacy.md`
- **Catégorie** : migration / docs / DX
- **Planifié à** : commit `dea034b`, 2026-09-01

## Pourquoi

La V1 n'est terminée que lorsque les deux Workers, D1, R2, Access, domaines et analytics fonctionnent ensemble avec des valeurs réelles. Ce plan garde ce passage manuel et contrôlé, documente le chemin reproductible et s'arrête dès qu'une intervention opérateur manque. Il ne crée pas de CI/CD et ne transforme pas la mise en ligne en projet d'infrastructure.

## État actuel attendu après le plan 006

- Toutes les fonctions V1 passent sur D1/R2 locaux avec `bun run check`.
- Les configs Wrangler contiennent des bindings locaux et des identifiants sentinelles empêchant un déploiement accidentel.
- `.env.example` liste toutes les clés Cloudflare, Access, URL, analytics, bootstrap et `LEGAL_*`; `.env` réel est ignoré.
- Le build production refuse les données légales factices.
- Aucune ressource distante n'a été créée par les plans précédents.
- CI/CD est explicitement hors périmètre.

Ressources que l'opérateur doit avoir créées ou autorisé à utiliser : compte/zone/domaine Cloudflare, D1, R2 + domaine média, deux hostnames Workers, organisation/application Access + whitelist exacte, site Web Analytics, token API limité et informations légales. Le plan vérifie ces ressources ; il n'en crée pas silencieusement une alternative.

## Commandes nécessaires

| But | Commande | Résultat attendu |
|---|---|---|
| Qualité locale | `bun run check` | exit 0 avant réseau |
| Préflight | `bun --env-file=.env run prod:preflight` | exit 0, affiche uniquement les noms de contrôles et `ok`/`missing` |
| Identité Cloudflare | `bun --env-file=.env x wrangler whoami` | exit 0, bon compte confirmé sans token |
| Inventaire D1 | `bun --env-file=.env x wrangler d1 list` | ressource attendue identifiée |
| Inventaire R2 | `bun --env-file=.env x wrangler r2 bucket list` | bucket attendu identifié |
| Migration distante | commande documentée à l'étape 5 | exit 0, migrations appliquées une fois |
| Déploiement | `bun --env-file=.env run deploy:production` | deux Workers déployés, exit 0 |
| Smoke | `bun --env-file=.env run smoke:production` | endpoints et protections attendus passent |

Les scripts doivent masquer valeurs, IDs complets, e-mails et jetons. Un nom de ressource public peut être affiché si nécessaire ; préférer un résumé.

## Outils conseillés

- Utiliser les skills `cloudflare`, `wrangler`, `workers-best-practices` et `cloudflare-one` si disponibles. Vérifier la syntaxe du Wrangler installé avec sa documentation courante avant toute commande distante.
- Références : [déployer TanStack Start](https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/), [variables/secrets Workers](https://developers.cloudflare.com/workers/configuration/environment-variables/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/), [R2 custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/) et [Access JWT](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/).
- Utiliser le navigateur avec session opérateur seulement pour les vérifications Access/domaines non disponibles proprement par CLI.

## Scope

**Dans le scope local** :

- `scripts/production/**` : preflight, génération éphémère de config, synchronisation runtime, bootstrap et smoke ;
- scripts racine de `package.json`, `bun.lock` seulement si une dépendance strictement nécessaire est ajoutée ;
- `apps/web/wrangler.jsonc`, `apps/admin/wrangler.jsonc` pour distinguer clairement local et template production sans secret ;
- `.gitignore`, `.env.example` si un fichier temporaire/nom réellement requis manque ;
- `docs/OPERATIONS.md` ;
- la ligne 007 de `plans/README.md`.

**Dans le scope distant, après préflight réussi** :

- appliquer les migrations à la D1 explicitement identifiée ;
- synchroniser uniquement les bindings runtime allowlistés vers les deux Workers ;
- déployer les deux Workers sur les hostnames prévus ;
- créer le premier profil admin dans D1 avec l'e-mail fourni ;
- effectuer puis nettoyer un upload R2 de smoke non référencé ;
- vérifier, mais ne pas élargir, la politique Access et le domaine R2.

**Hors scope** :

- création automatique d'un compte, zone, domaine, Zero Trust ou whitelist ;
- CI/CD, GitHub Actions, Terraform, Pulumi, Alchemy ou environnement staging ;
- modification fonctionnelle/UI/schéma, contenu de production fictif ou import de corpus ;
- stockage du token API dans Worker, commit de valeur `.env`, impression des secrets ;
- changement DNS/Access non prévu ou purge/destruction d'une ressource existante ;
- rotation d'un secret sans demande explicite.

## Workflow Git

- Créer `codex/007-production-handoff` depuis la livraison 006.
- Toutes les vérifications locales et distantes doivent réussir avant le commit unique.
- Un seul commit : `plan(007): document and verify production operations`.
- Pousser la branche ; ne pas ouvrir de PR/fusionner sauf demande. Ne pas créer de workflow CI/CD.

## Étapes

### 1. Prouver que la base locale est livrable

Vérifier plans 001–006 `DONE`, worktree propre et branche basée sur leurs livraisons. Exécuter migration locale, tests, typecheck et builds. Chercher sentinelles, secrets et fonctionnalités interdites dans les sources/versionnés, sans lire `.env`.

Commandes minimales : `bun run db:migrate:local`, `bun run check`, `git grep -n "replace-with-production\|REPLACE_BEFORE_PRODUCTION" -- ':!.env'`, `git ls-files '.env*'`.

Résultat attendu : seul `.env.example` est versionné ; aucune sentinelle n'est utilisée dans une sortie production ; tous les checks sortent 0. Une valeur `replace-me` est permise uniquement dans `.env.example` et les tests de configuration.

**Vérifier** : `git status --short` vide et `bun run check` exit 0. Si non, STOP avant réseau.

### 2. Créer un preflight qui ne révèle aucune valeur

Créer `scripts/production/preflight.ts`. Il valide uniquement la présence/forme des variables de `docs/ENVIRONMENT.md`, les URLs HTTPS distinctes, l'absence de valeurs factices, la cohérence des hostnames, et confirme que `DEV_AUTH_EMAIL` n'est jamais inclus dans la configuration production.

Il doit afficher une liste de noms de contrôles avec `ok`/`missing`/`invalid`, jamais la valeur, sa longueur, son préfixe ou l'e-mail. Il échoue si le token API semble absent, si un champ légal requis manque, si les domaines sont localhost ou si public/admin/media se confondent.

Créer un test qui fournit un environnement factice en mémoire : complet accepté, chaque catégorie manquante rejetée, et capture stdout prouvant qu'aucune valeur de fixture ne fuite.

**Vérifier** : `bun run test -- scripts/production/preflight.test.ts` sort 0 ; `bun --env-file=.env run prod:preflight` sort 0 ou liste seulement les clés manquantes puis STOP.

### 3. Inventorier et confirmer les cibles Cloudflare en lecture seule

Avec le `.env` chargé par Bun, exécuter `wrangler whoami`, inventorier D1/R2/Workers/routes disponibles et comparer par identifiant/nom via un script qui n'imprime pas les valeurs complètes. Ne créer ni modifier rien.

Confirmer avec l'opérateur si : plusieurs comptes correspondent, le domaine ou les noms de Workers existent déjà avec un autre projet, D1 contient des tables/données inattendues, R2 contient des objets, ou un hostname est déjà routé. Une ressource non vide n'est jamais supposée jetable.

Vérifier dans Cloudflare Access que l'application cible exactement le hostname admin et possède les e-mails demandés. Ne lister ces e-mails ni dans un log ni dans `docs/OPERATIONS.md`. Vérifier le domaine personnalisé R2 et que `r2.dev` est désactivé.

**Vérifier** : rapport de préflight « compte, D1, R2, domaines, Access, analytics : ok » sans ID/token/e-mail. Tout `missing` ou collision = STOP.

### 4. Générer une configuration production éphémère et synchroniser les bindings

Wrangler exige les identifiants D1/R2 dans sa configuration. Créer un script qui lit les variables déjà chargées, rend deux configs production dans un répertoire `mktemp` avec permissions restrictives, puis les supprime dans un `finally`. Ne jamais les écrire dans le dépôt ni les logs.

La config web contient D1 et variables runtime publiques nécessaires, jamais R2/Access/token API. La config admin contient D1, R2, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`, URLs nécessaires et `ENVIRONMENT=production`. `DEV_AUTH_EMAIL`, `BOOTSTRAP_ADMIN_EMAIL` et `CLOUDFLARE_API_TOKEN` ne doivent jamais devenir des bindings Workers.

Pour les valeurs runtime non destinées au navigateur mais nécessaires au rendu légal/auth, utiliser la gestion de secrets/variables Workers avec une allowlist exacte. Si un fichier temporaire est requis par `wrangler secret bulk`, il est mode 600, ne contient jamais le token API, et est supprimé immédiatement. Ne passer aucune valeur en argument de commande susceptible d'apparaître dans l'historique/process list.

**Vérifier** : tests de génération sur fixtures, configs dans un temp externe, web sans `MEDIA`/Access, aucun secret opérateur, cleanup même en erreur ; `git status` inchangé.

### 5. Appliquer les migrations distantes et bootstrapper l'admin

Avant migration, lister l'état de migration distant en lecture seule. Sur une D1 vide/confirmée, appliquer `packages/db/migrations` avec la config production éphémère admin et `--remote`. Relancer la commande : aucune migration supplémentaire.

Adapter le bootstrap du plan 003 pour un mode distant explicite. Il génère un fichier SQL temporaire paramétré/échappé ou utilise une API sûre, crée uniquement `BOOTSTRAP_ADMIN_EMAIL` comme admin actif et applique les mêmes règles d'idempotence. Ne placer jamais l'e-mail dans la ligne de commande ou la sortie. Supprimer le fichier temporaire dans `finally`.

Si D1 contient déjà un auteur différent, des tables non Jouzy ou des migrations divergentes, STOP ; ne pas modifier/promouvoir/effacer.

**Vérifier** : migration distante et seconde exécution exit 0 ; bootstrap puis seconde exécution exit 0 ; une requête comptable confirme exactement un profil admin attendu sans imprimer ses champs.

### 6. Déployer les Workers et vérifier les domaines

Créer `deploy:production` qui : preflight, génération de configs, synchronisation allowlistée, build puis déploiement admin et web. Utiliser les commandes Wrangler officielles courantes et conserver les IDs de déploiement uniquement dans la sortie opérateur standard, pas dans un fichier secret.

Déployer l'admin sur son hostname déjà protégé Access, puis le web. Un échec du web ne doit pas retirer l'admin ; documenter l'état partiel. Ne lancer aucune purge de cache globale.

Confirmer TLS et hostnames publics. Vérifier que le domaine média répond pour l'objet de smoke et que l'URL `r2.dev` publique est désactivée. L'upload de smoke passe par le binding/admin ou un script Worker autorisé, puis supprime l'objet et la ligne D1 non référencés.

**Vérifier** : `deploy:production` exit 0 ; inventaire Wrangler montre un déploiement récent pour chacun ; aucun fichier temp ne subsiste dans le repo ; smoke média upload/read/delete exit 0.

### 7. Effectuer les smoke tests publics et Access

Créer `smoke:production` avec requêtes non destructives :

- accueil 200, headers sécurité/cache et aucune sentinelle légale ;
- recherche 200/noindex/no-store ;
- RSS/sitemap/robots 200 et content types valides ;
- mentions/confidentialité 200 ;
- hostname admin sans session renvoie vers/refuse via Access, jamais le dashboard ;
- URLs inexistantes 404 sans détail ;
- Web Analytics présent une seule fois sur le public et absent admin.

Dans un navigateur authentifié Access, vérifier dashboard et identité bootstrap ; créer un brouillon minimal puis le supprimer si le produit supporte la suppression, sinon le laisser explicitement nommé comme brouillon de vérification seulement avec accord opérateur. Préférer ne créer aucun contenu persistant. Vérifier qu'un embed de fixture locale ne contacte aucun tiers avant clic.

**Vérifier** : script smoke exit 0 et contrôle navigateur Access réussi. Si la session opérateur ne peut pas être automatisée, rapporter précisément cette dernière vérification comme `AWAITING OPERATOR`, sans la déclarer réussie.

### 8. Écrire le runbook, vérifier la récupération et livrer

Créer `docs/OPERATIONS.md` avec : architecture déployée, prérequis, commandes preflight/migrations/deploy/smoke, ajout/retrait d'auteur en deux étapes, upload/média, observation logs, rollback Worker via commande Wrangler courante, comportement cache 60 s, gestion d'un échec partiel R2/D1, rotation des valeurs et liste des vérifications manuelles. Aucun secret, ID complet, e-mail ou valeur légale personnelle n'y apparaît.

Documenter que les migrations D1 sont forward-only : un rollback Worker ne défait pas le schéma. Avant une future migration destructive, export/backup et plan séparé obligatoires. Documenter aussi qu'une désactivation Access + D1 ne dépublie pas les anciens articles.

Exécuter une dernière fois preflight, smoke et check. Mettre la ligne 007 sur `DONE` seulement si toutes les vérifications, y compris Access opérateur, sont réellement faites ; sinon `BLOCKED: AWAITING OPERATOR — <vérification exacte>`. Créer le commit unique et pousser la branche.

**Vérifier** : `bun run check`, `prod:preflight` et `smoke:production` sortent 0 ; `git diff --check` vide ; worktree propre après commit ; branche distante présente.

## Plan de tests

- Preflight : variables complètes/manquantes/factices, URLs incohérentes, aucune fuite stdout/stderr.
- Génération config : allowlists web/admin, absence de secrets opérateur et fichiers temp nettoyés en succès/erreur.
- Bootstrap distant : création, idempotence, conflit sans mutation ni e-mail en sortie.
- Migrations : état avant, application, réapplication sans changement.
- Smoke HTTP : statuts, content types, cache, sécurité, noindex et présence analytics correcte.
- R2 : upload/read/delete d'un objet explicitement de smoke et non référencé.
- Navigateur : Access refuse anonyme, autorise l'admin bootstrapé, aucun tiers embed avant clic.

## Critères de fin

- [ ] L'opérateur a fourni tous les comptes/ressources/valeurs exacts et le preflight les valide sans fuite.
- [ ] Les cibles ont été inventoriées en lecture seule avant toute mutation ; aucune collision ignorée.
- [ ] Migrations et bootstrap distants sont appliqués/idempotents sur la D1 prévue.
- [ ] Le web n'a pas R2/Access ; l'admin a D1/R2/Access ; aucun token API n'est un binding runtime.
- [ ] Deux Workers, domaines, R2 custom domain, Access et Web Analytics sont réellement vérifiés.
- [ ] Smoke public, média et navigateur Access ont un résultat réel, pas supposé.
- [ ] `docs/OPERATIONS.md` permet de redéployer, retirer un auteur et diagnostiquer/rollback sans secret.
- [ ] Aucune CI/CD, IaC ou fonctionnalité produit supplémentaire n'a été ajoutée.
- [ ] `bun run check`, preflight et smoke sortent 0.
- [ ] Un seul commit est poussé sur `codex/007-production-handoff`; statut `DONE` ou blocage opérateur exact.

## Conditions STOP

- L'instruction explicite d'exécuter ce plan avec mutations Cloudflare n'a pas été donnée.
- `.env`/une variable, un compte, une ressource, un hostname, une whitelist ou une information légale manque ou reste factice.
- `wrangler whoami` cible un compte inattendu, ou D1/R2/Worker/domain existe avec contenu/projet non confirmé.
- D1 distante contient des migrations/tables/données divergentes.
- Access n'est pas en place avant exposition de l'admin ou ne cible pas exactement son hostname.
- `r2.dev` reste public ou le domaine média personnalisé n'est pas actif.
- Un script afficherait/passerait en argument un jeton, e-mail ou contenu `.env`.
- Une étape nécessite CI/CD, Alchemy, création automatique de compte/zone ou modification produit hors scope.
- Un smoke échoue deux fois ; ne pas masquer l'état partiel ni continuer à déclarer la production saine.

## Notes de maintenance

- Ce runbook est le chemin de mise en ligne jusqu'à une décision CI/CD séparée.
- Les secrets locaux et Cloudflare ont des cycles distincts ; une rotation doit mettre à jour les deux emplacements autorisés.
- Toute future migration destructive exige sauvegarde, fenêtre de maintenance et plan dédié.
- En revue, inspecter les allowlists de variables et s'assurer que le Worker web ne reçoit jamais `MEDIA`, `ACCESS_*` ou le token API.

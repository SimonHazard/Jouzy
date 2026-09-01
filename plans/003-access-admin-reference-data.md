# Plan 003 : Protéger l'admin et gérer les auteurs, jeux et taxonomies

> **Instructions exécuteur** : suivre les étapes sans implémenter l'éditeur d'articles. Lire `AGENTS.md`, `docs/PRODUCT.md` (utilisateurs et administration), `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/ENVIRONMENT.md` et ADR-0003. Toutes les autorisations doivent être prouvées côté serveur. Modifier uniquement la ligne 003 de `plans/README.md` à la fin. STOP au lieu d'inventer un fournisseur d'identité ou une permission.
>
> **Drift check — à lancer en premier** : `git diff --stat dea034b..HEAD -- apps/admin packages/db packages/domain packages/ui scripts package.json bun.lock`
> Les changements des plans 001–002 sont attendus. Vérifier que les chemins, bindings et contrats décrits ci-dessous existent. Toute divergence non purement cosmétique est une condition STOP.

## Statut

- **Priorité** : P1
- **Effort** : L
- **Risque** : HIGH
- **Dépend de** : `plans/002-cloudflare-data-foundation.md`
- **Catégorie** : security / direction / tests
- **Planifié à** : commit `dea034b`, 2026-09-01

## Pourquoi

Cloudflare Access bloque l'entrée du back-office, mais Jouzy doit encore valider le jeton et limiter chaque utilisateur à son rôle. Ce plan installe cette frontière avant toute publication sensible et livre seulement les référentiels nécessaires à l'éditeur : auteurs, jeux, plateformes, genres et tags. Il évite de mêler sécurité, catalogue et Markdown dans une seule livraison impossible à relire.

## État actuel attendu après le plan 002

- `apps/admin` est un Worker TanStack Start avec bindings typés `DB` et `MEDIA`.
- `packages/db` expose une factory D1/Drizzle et les tables documentées, sans CRUD applicatif.
- `packages/domain` expose les enums, validations et normalisations de base.
- Aucun login, session, middleware Access, identité locale, dashboard ou formulaire métier n'existe.
- `authors.email` est privé, unique et normalisé ; `role` vaut `admin` ou `author`, `status` vaut `active` ou `disabled`.

Contrat d'autorisation à implémenter :

| Action | `admin` | `author` |
|---|---:|---:|
| accéder à l'admin avec profil actif | oui | oui |
| gérer auteurs | oui | non |
| créer/modifier jeux, plateformes, genres, tags | oui | non |
| consulter ces référentiels | oui | oui |
| gérer n'importe quelle publication | oui | non |
| gérer sa propre publication | oui | oui |

L'autorisation publication est créée/testée ici comme fonction de politique, mais ses routes arrivent au plan 004.

## Commandes nécessaires

| But | Commande | Résultat attendu |
|---|---|---|
| Installation | `bun install` | exit 0 |
| Migration locale | `bun run db:migrate:local` | exit 0 |
| Bootstrap local | `bun --env-file=.env run admin:bootstrap` | crée le premier admin ou confirme l'idempotence sans afficher l'e-mail complet |
| Tests auth | `bun run test -- apps/admin/src/features/auth packages/domain/src/permissions` | exit 0 |
| Tests référentiels | `bun run test -- apps/admin/src/features/reference-data packages/db/src/queries/admin` | exit 0 |
| Vérification globale | `bun run check` | exit 0 |

La commande bootstrap nécessite un `.env` local fourni par l'opérateur. Ne pas ouvrir ce fichier. Si `BOOTSTRAP_ADMIN_EMAIL` est absent, les tests doivent utiliser leurs fixtures et l'étape bootstrap manuelle est `BLOCKED`, pas simulée avec une adresse inventée.

## Outils conseillés

- Utiliser les skills `cloudflare`, `cloudflare-one`, `workers-best-practices` et `shadcn` si disponibles.
- Références : [protéger un Worker avec Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [valider le JWT Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/) et [application self-hosted Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/choose-application-type/).
- Utiliser `jose` pour JOSE/JWT ; ne pas écrire de vérification cryptographique maison.

## Scope

**Dans le scope** :

- `apps/admin/src/features/auth/**` ;
- `apps/admin/src/features/authors/**`, `games/**`, `taxonomies/**` ;
- `apps/admin/src/routes/__root.tsx`, `_protected.tsx`, `_protected/**` selon la convention créée au plan 001 ;
- shell/navigation/états d'erreur de l'admin sous `apps/admin/src/components/**` ;
- `packages/domain/src/permissions/**` et validations de référentiels ;
- `packages/db/src/queries/admin/authors.ts`, `games.ts`, `taxonomies.ts` et tests associés ;
- composants shadcn officiels supplémentaires strictement nécessaires dans `packages/ui/**` ;
- `scripts/bootstrap-admin.ts`, scripts `package.json`, `bun.lock` ;
- la ligne 003 de `plans/README.md`.

**Hors scope** :

- politiques/panneaux Cloudflare Access distants et adresses réelles de whitelist ;
- mot de passe, session Jouzy, Better Auth, formulaire de connexion ou invitation ;
- CRUD, aperçu ou publication d'articles ;
- upload R2, Markdown, site public, recherche, analytics ou déploiement ;
- édition de `.env` ou impression de ses valeurs ;
- suppression en cascade de référentiels déjà utilisés.

## Workflow Git

- Créer `codex/003-access-admin-reference-data` depuis la livraison du plan 002.
- Un seul commit : `plan(003): secure the admin reference data`.
- Pousser après vérification ; ne pas ouvrir de PR, fusionner, déployer ou commencer le plan 004.

## Étapes

### 1. Créer un validateur JWT Access testable

Ajouter `jose`. Dans `apps/admin/src/features/auth/access-jwt.server.ts`, créer une fonction qui reçoit le jeton, `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` et une source JWKS injectable. En production, utiliser `createRemoteJWKSet(new URL('/cdn-cgi/access/certs', teamDomain))`; en test, injecter une JWKS locale.

Valider obligatoirement signature, algorithme autorisé, expiration, issuer, audience et claim e-mail non vide. Normaliser l'e-mail avec `packages/domain`. Retourner une identité minimale et typée ; ne jamais journaliser le JWT.

Le module doit réutiliser prudemment le cache interne immuable de `jose`, sans cache d'identité utilisateur. Une erreur de clé/réseau est un refus temporaire explicite, jamais un accès accordé.

**Vérifier** : tests avec clé locale couvrent jeton valide, expiré, issuer erroné, audience erronée, signature erronée et e-mail absent ; tous passent sans appel réseau.

### 2. Résoudre l'identité applicative et le mode local

Créer un middleware serveur TanStack Start selon l'API courante du scaffold. Il lit `Cf-Access-Jwt-Assertion`, valide le JWT puis cherche `authors.email_normalized` dans D1. Refuser si profil absent ou désactivé. Le contexte de requête expose seulement `authorId`, `email`, `role` et `displayName`.

En développement uniquement (`ENVIRONMENT === 'development'`), l'absence de JWT peut utiliser `DEV_AUTH_EMAIL`. Ce chemin passe tout de même par la recherche D1 d'un auteur actif. Si `DEV_AUTH_EMAIL` est défini dans un autre environnement, lever une erreur de configuration au démarrage de la requête.

Appliquer ce middleware à toute route et fonction serveur sous `_protected`. Une page client ne doit pas pouvoir contourner une fonction serveur non protégée.

**Vérifier** : tests pour production sans header, profil absent, profil disabled, auteur actif, admin actif et bypass local interdit en production ; `rg -n "DEV_AUTH_EMAIL" apps/admin` ne trouve son usage que dans le module serveur/test.

### 3. Centraliser les politiques de rôle et propriété

Dans `packages/domain/src/permissions`, créer des fonctions pures `canManageAuthors`, `canManageReferenceData`, `canReadArticle` et `canMutateArticle`. Les trois dernières reçoivent une identité et, pour l'article, `authorId` propriétaire. Une permission refusée produit un code `FORBIDDEN`; une ressource absente reste `NOT_FOUND` sans révéler l'existence à un autre auteur.

Toutes les futures mutations devront appeler ces fonctions. Ne pas disperser des comparaisons `role === 'admin'` dans les routes en dehors de l'adaptateur d'affichage.

**Vérifier** : table de tests exhaustive admin/auteur/propriétaire/autre/désactivé ; `rg -n "role\s*===\s*['\"]admin" apps/admin/src/features` ne trouve aucune autorisation métier dupliquée.

### 4. Ajouter un bootstrap admin local idempotent

Créer `scripts/bootstrap-admin.ts`. Il reçoit la base locale via la commande Wrangler ou l'adaptateur prévu par le repo et lit `BOOTSTRAP_ADMIN_EMAIL` depuis l'environnement déjà chargé par Bun. Il normalise l'adresse et :

- crée un auteur `admin` actif avec un display name provisoire dérivé sans exposer l'adresse dans les logs si aucun profil n'existe ;
- sort 0 sans mutation si ce profil est déjà admin actif ;
- refuse de promouvoir/réactiver silencieusement un profil existant différent et demande une décision opérateur.

Le script n'ajoute jamais l'adresse à Cloudflare Access et l'indique dans son message de fin. Il ne lit pas `.env` lui-même.

**Vérifier** : deux exécutions sur une base de test sortent 0 et ne créent qu'une ligne ; cas conflit sort non-zéro sans modifier la ligne ni afficher l'e-mail complet.

### 5. Construire les requêtes admin de référentiels

Dans `packages/db/src/queries/admin`, ajouter des opérations explicites, toutes paramétrées :

- auteurs : list/get/create/update/disable, sans exposer l'e-mail privé dans les DTO publics ;
- jeux : list/get/create/update, plateformes/genres et liens boutique dans une transaction ;
- taxonomies : list/create/update pour plateformes, genres et tags.

Normaliser et vérifier les conflits de slug/e-mail. Toute suppression d'un référentiel référencé renvoie `CONFLICT`; préférer `disabled` pour les auteurs et conserver les contenus. Ne pas ajouter de méthode `deleteAuthor`.

Les requêtes reçoivent une transaction/client et des entrées déjà validées. Elles n'effectuent pas l'autorisation elles-mêmes : la feature serveur l'applique avant l'appel.

**Vérifier** : tests D1 locaux pour création, mise à jour, unicité, transaction jeu+relations et refus de suppression référencée.

### 6. Construire le shell admin protégé

Créer un layout `_protected` avec navigation accessible : tableau de bord, publications (placeholder non cliquable ou page « prochain plan »), jeux, taxonomies et auteurs visible uniquement pour l'admin. Afficher l'identité courante et son rôle, sans lien de logout Jouzy ; la déconnexion relève de Cloudflare Access.

Le dashboard affiche uniquement les compteurs disponibles et un état vide. Utiliser les composants officiels shadcn déjà présents : `Sheet` pour la navigation mobile avec titre accessible, `DropdownMenu`, `Card`, `Badge`, `Skeleton`, `Alert` et `Button`. Aucune esthétique finale au-delà des tokens existants.

Gérer clairement : 401/Access absent, 403/profil non autorisé, 404 et erreur D1. Ne jamais afficher stack trace ou claims JWT.

**Vérifier** : tests de rendu pour navigation admin vs auteur, titres accessibles des overlays et pages d'erreur sans détail interne.

### 7. Ajouter les écrans auteurs, jeux et taxonomies

Implémenter formulaires/listes avec server functions protégées :

- auteurs : admin seulement ; prénom, nom, pseudo, slug, bio, avatar laissé vide jusqu'au plan média, rôle, statut, e-mail privé, e-mail public et liens sociaux ;
- jeux : admin seulement en mutation, tous rôles en lecture ; titre, slug, développeur, éditeur, date+précision, plateformes, genres et liens boutique ; la couverture reste vide jusqu'à la bibliothèque média du plan 004 ;
- taxonomies : admin seulement en mutation, tous rôles en lecture.

Composer avec `FieldGroup`, `Field`, labels/descriptions/erreurs. Valider côté client pour l'ergonomie et obligatoirement côté serveur. Les confirmations destructives utilisent `Dialog` et ne proposent que les opérations supportées. Le formulaire auteur rappelle que l'adresse doit aussi être gérée manuellement dans Cloudflare Access.

**Vérifier** : tests des server functions avec identité auteur/admin ; l'auteur reçoit 403 sur toute mutation de référentiel, l'admin réussit, et les erreurs uniques apparaissent au bon champ.

### 8. Vérifier les parcours et livrer

Lancer les deux apps localement avec la base migrée et un admin bootstrapé, sans exposer/ouvrir `.env`. Dans un navigateur réel, vérifier : navigation clavier, menu mobile, création/modification d'un jeu, d'un tag et d'un auteur de test ; connexion locale auteur qui voit les référentiels mais pas leur mutation.

Supprimer uniquement les données de test explicitement identifiées et non référencées. Lancer toute la suite, mettre 003 sur `DONE`, committer une fois et pousser.

**Vérifier** : `bun run db:migrate:local && bun run test && bun run check` sort 0 ; `git diff --check` est vide ; après commit le worktree est propre et la branche distante existe.

## Plan de tests

- JWT : valide, expiré, mauvais issuer/audience/signature, claim absent, panne JWKS.
- Résolution : header absent, profil absent, profil désactivé, auteur/admin actifs, bypass local et interdiction production.
- Permissions : matrice complète de rôles et propriété article.
- Bootstrap : première création, idempotence, conflit existant.
- Requêtes D1 : CRUD valide, unicité, transactions et références empêchant suppression.
- Server functions : validation répétée côté serveur et refus auteur.
- UI : libellés, erreurs, états vides, overlay titré, navigation selon rôle.
- Vérification navigateur à environ 390 px et 1440 px, clavier compris.

## Critères de fin

- [ ] Chaque requête admin protégée valide le JWT Access ou le bypass strictement local.
- [ ] Profil absent/désactivé et permissions insuffisantes sont refusés côté serveur.
- [ ] Les politiques de rôle/propriété sont centralisées et testées.
- [ ] Le bootstrap admin est idempotent et ne logue aucune valeur sensible.
- [ ] Les CRUD auteurs/jeux/taxonomies respectent le tableau d'autorisation.
- [ ] Aucun mot de passe, session applicative, invitation ou API Cloudflare n'a été ajouté.
- [ ] Les formulaires shadcn sont accessibles et validés côté serveur.
- [ ] `bun run test` et `bun run check` sortent 0 ; parcours navigateur vérifiés.
- [ ] Seuls les chemins du scope et la ligne 003 sont modifiés.
- [ ] Un seul commit est poussé sur `codex/003-access-admin-reference-data`.

## Conditions STOP

- Le plan 002 n'est pas terminé ou les bindings/schémas ne correspondent pas aux contrats.
- La version TanStack Start ne permet pas un middleware serveur commun aux routes/functions protégées sans déplacer l'auth dans le client.
- `jose` n'est pas compatible Workers avec le scaffold courant ou la documentation Access exige un claim différent non couvert.
- Une adresse réelle manque pour le bootstrap : ne pas en inventer ; terminer les tests et rapporter l'étape opérateur.
- Le CRUD nécessite de modifier le schéma ou une permission produit non documentée.
- Une mutation pourrait contourner la politique via une route/fonction non protégée.
- Un test ou build échoue deux fois, ou un changement hors scope devient nécessaire.
- Un jeton, e-mail privé complet ou contenu de `.env` apparaît dans les logs/diffs.

## Notes de maintenance

- Cloudflare Access et D1 forment deux verrous indépendants : retirer un auteur exige de le désactiver en D1 et de mettre à jour la politique Access.
- Le cache JWKS peut vivre au niveau module ; l'identité et le rôle D1 doivent être recalculés par requête.
- En revue, chercher toute server function admin qui n'utilise pas le middleware commun.
- Le bouton/écran publications reste volontairement vide jusqu'au plan 004.

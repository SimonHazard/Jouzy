# Architecture

## Vue d'ensemble

Jouzy est un monorepo TypeScript composé de deux applications TanStack Start déployées comme deux Workers Cloudflare. Elles partagent du code compilé, une base D1 et une convention de lecture des médias R2, mais ne s'appellent pas entre elles à l'exécution.

```text
Lecteur -> apps/web Worker -> D1 (lecture)
                         -> images via domaine public R2
                         -> fournisseur externe après clic uniquement

Auteur -> Cloudflare Access -> apps/admin Worker -> validation JWT Access
                                                -> D1 (lecture/écriture)
                                                -> R2 (upload/suppression)
```

Cette architecture évite un troisième service API et son contrat réseau. Les fonctions serveur TanStack Start constituent la frontière serveur de chaque application.

## Arborescence cible

```text
apps/
  web/
    src/routes/            # routes publiques et endpoints RSS/sitemap
    src/server/            # lectures publiques et en-têtes cache
    vite.config.ts
    wrangler.jsonc
  admin/
    src/routes/            # routes protégées du back-office
    src/server/            # identité Access, autorisation et mutations
    vite.config.ts
    wrangler.jsonc
packages/
  config/                  # tsconfig et configuration Biome partagés
  content/
    src/markdown/          # parseur, AST autorisé et renderer React
    src/embeds/            # normalisation des fournisseurs et placeholders
  db/
    src/schema/            # tables Drizzle
    src/queries/           # requêtes publiques et admin explicitement séparées
    migrations/            # migrations D1 versionnées
  domain/
    src/                   # schémas de validation, permissions et invariants
  ui/
    src/components/        # composants shadcn/ui officiels et compositions
    src/styles/            # tokens de thèmes partagés
project.inlang/            # configuration Paraglide
messages/fr.json           # messages d'interface français
docs/
plans/
```

Le scaffold Better-T-Stack peut produire des noms différents. Le plan 001 doit les normaliser vers cette structure avant que les plans suivants ne commencent.

## Responsabilités

### `apps/web`

- n'expose que les contenus `published` ;
- ne contient aucune mutation métier ;
- requête D1 à travers les fonctions de lecture de `packages/db` ;
- rend le Markdown via `packages/content` ;
- applique des en-têtes de cache courts aux pages publiées ;
- génère RSS, sitemap, métadonnées sociales et données structurées ;
- charge Cloudflare Web Analytics uniquement en production.

Un cache partagé avec `s-maxage=60` et `stale-while-revalidate=600` est le point de départ. Il évite un mécanisme de purge et son jeton supplémentaire. Les pages peuvent donc mettre jusqu'à environ une minute à refléter une modification publiée ; cette limite doit être visible dans l'admin. Les recherches personnalisées restent non mises en cache.

### `apps/admin`

- suppose la présence de Cloudflare Access en production, sans lui déléguer toute la sécurité ;
- valide `Cf-Access-Jwt-Assertion`, son émetteur et son audience à chaque requête protégée ;
- associe l'e-mail vérifié à un auteur D1 actif ;
- applique les permissions d'auteur/admin avant chaque lecture ou mutation ;
- propose l'aperçu privé, les formulaires et les uploads R2 ;
- ne rend jamais un brouillon accessible depuis le Worker public.

En développement local, une identité factice explicite `DEV_AUTH_EMAIL` peut remplacer Access. Elle est interdite dès que l'environnement n'est pas `development`.

### Paquets partagés

- `domain` ne dépend ni de React, ni de Cloudflare, ni de Drizzle ;
- `db` dépend de Drizzle et expose des opérations nommées, pas un accès SQL libre aux routes ;
- `content` transforme un Markdown non fiable en arbre contrôlé et composants sûrs ;
- `ui` contient les composants shadcn/ui et leurs compositions, sans logique métier ;
- les applications peuvent dépendre des paquets, jamais l'inverse.

## Données et cohérence

D1 est la source de vérité pour les métadonnées et le Markdown. R2 est la source binaire pour les images. Les clés R2 sont aléatoires, immuables et stockées en base ; aucune URL complète n'est persistée.

La publication est une transaction D1 : validation de tous les invariants, mise à jour du statut et de la date. Un asset référencé ne peut pas être supprimé. Pour un asset orphelin, l'admin supprime d'abord l'objet R2 puis sa ligne D1 ; un échec partiel est journalisé et signalé, sans masquer l'erreur.

## Médias

- uploads via le binding R2 de l'admin, sans clés S3 ni URL présignée en V1 ;
- formats acceptés : JPEG, PNG, WebP et AVIF ;
- taille maximale initiale : 10 Mio ;
- validation du contenu MIME, dimensions, poids et métadonnées côté serveur ;
- texte alternatif obligatoire avant toute insertion ou publication ;
- légende et crédit facultatifs ;
- lecture par domaine personnalisé Cloudflare, jamais par `r2.dev` en production ;
- suppression interdite lorsqu'un asset est utilisé comme couverture ou directive Markdown.

Les variantes et transformations d'image sont différées. Les auteurs doivent téléverser une image déjà raisonnablement dimensionnée ; l'admin affiche les dimensions et le poids avant validation.

## Markdown et embeds

Le parseur accepte CommonMark/GFM et deux directives Jouzy. Il ignore/rejette le HTML brut. Chaque directive est validée côté serveur avant enregistrement et de nouveau au rendu.

Le renderer produit des composants React maîtrisés. Un embed externe produit d'abord un placeholder avec fournisseur, type de contenu et bouton « Charger ce contenu externe ». Le composant iframe n'est monté qu'après ce clic, avec les attributs `sandbox`, `allow` et `referrerPolicy` minimaux compatibles avec le fournisseur.

## Internationalisation

Paraglide JS est initialisé dans le monorepo avec `fr` comme locale de base et unique locale. Les textes d'interface passent par les fonctions générées ; le contenu éditorial reste français en V1. Les URL françaises ne portent pas de préfixe. L'ajout futur d'une locale devra introduire une stratégie d'URL explicite et des variantes traduites de contenu, sans être anticipé dans le schéma V1.

## Observabilité et erreurs

- erreurs structurées côté serveur, sans donnée personnelle ni secret dans les logs ;
- identifiant de requête propagé quand Cloudflare en fournit un ;
- pages d'erreur publiques sobres et sans détail interne ;
- erreurs admin actionnables, distinguant validation, permission, conflit et indisponibilité ;
- aucun service d'observabilité tiers en V1. Les logs Workers et les métriques Cloudflare suffisent au démarrage.

## Déploiement

Chaque application possède sa configuration Wrangler et son Worker. Les bindings pointent vers la même D1 ; seul l'admin reçoit R2. Le déploiement initial reste manuel et documenté. Les workflows GitHub et la promotion automatisée entre environnements seront décidés après stabilisation de la V1.

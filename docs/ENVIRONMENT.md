# Environnements, comptes et secrets

## Règle générale

Un fichier racine `.env` centralise les valeurs nécessaires au développement et aux opérations manuelles. Il est ignoré par Git et ne doit jamais être affiché, copié dans un plan ou transmis dans un log. Le dépôt versionne uniquement `.env.example` avec les noms de variables et des valeurs factices.

La production ne consomme pas le fichier local : les secrets sont créés dans Cloudflare et les bindings sont déclarés dans chaque `wrangler.jsonc`. Il ne faut pas maintenir à la fois `.dev.vars` et `.env` pour un même usage local.

## Comptes et ressources à fournir

Avant le plan de mise en ligne, l'opérateur fournit ou crée :

1. un compte Cloudflare avec un domaine actif ;
2. deux noms d'hôtes, un public et un pour l'admin ;
3. une base D1 de production ;
4. un bucket R2 et son domaine public personnalisé, avec `r2.dev` désactivé ;
5. une organisation Cloudflare Zero Trust, une application Access pour l'admin et une politique « Include » contenant les adresses exactes autorisées ;
6. un jeton API Cloudflare limité aux ressources et actions nécessaires au déploiement ;
7. un site Cloudflare Web Analytics pour le domaine public ;
8. l'adresse e-mail du premier administrateur ;
9. les informations légales définitives de l'éditeur et de l'hébergeur.

Aucun compte Neon, Convex, PostHog, fournisseur d'e-mail, stockage S3 ou catalogue de jeux n'est nécessaire en V1.

## Contrat `.env.example`

Le plan 001 doit créer un fichier contenant au minimum les clés suivantes, sans valeur réelle :

```dotenv
# Cloudflare CLI and provisioning — local operator only
CLOUDFLARE_ACCOUNT_ID="replace-me"
CLOUDFLARE_API_TOKEN="replace-me"
CLOUDFLARE_ZONE_ID="replace-me"

# Deployed resources
CLOUDFLARE_D1_DATABASE_ID="replace-me"
CLOUDFLARE_R2_BUCKET_NAME="jouzy-media"

# Public configuration
PUBLIC_SITE_URL="https://example.com"
ADMIN_SITE_URL="https://admin.example.com"
R2_PUBLIC_BASE_URL="https://media.example.com"
PUBLIC_WEB_ANALYTICS_TOKEN="replace-me"

# Cloudflare Access
ACCESS_TEAM_DOMAIN="https://example.cloudflareaccess.com"
ACCESS_AUD="replace-me"

# Local development only
DEV_AUTH_EMAIL="admin@example.com"
BOOTSTRAP_ADMIN_EMAIL="admin@example.com"

# Legal public information — replace before production
LEGAL_PUBLISHER_NAME="replace-me"
LEGAL_PUBLISHER_STATUS="replace-me"
LEGAL_PUBLISHER_ADDRESS="replace-me"
LEGAL_CONTACT_EMAIL="replace-me"
LEGAL_CONTACT_PHONE="replace-me"
LEGAL_REGISTRATION="replace-me-if-applicable"
LEGAL_VAT_NUMBER="replace-me-if-applicable"
LEGAL_PUBLICATION_DIRECTOR="replace-me"
LEGAL_HOST_NAME="replace-me"
LEGAL_HOST_ADDRESS="replace-me"
LEGAL_HOST_PHONE="replace-me"
```

Les valeurs `PUBLIC_*` sont exposables au navigateur seulement lorsqu'elles sont explicitement injectées côté client. Toutes les autres restent serveur/opérateur. Le préfixe `VITE_` est interdit pour les secrets.

## Répartition par application

| Valeur ou binding | Web public | Admin | Local/opérateur |
|---|---:|---:|---:|
| binding D1 | lecture applicative | lecture/écriture | migrations locales/distantes |
| binding R2 | non | oui | provisionnement |
| `R2_PUBLIC_BASE_URL` | oui | oui | oui |
| `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` | non | serveur | configuration Access |
| `DEV_AUTH_EMAIL` | non | développement uniquement | oui |
| token Web Analytics | client public en production | non | configuration |
| `CLOUDFLARE_API_TOKEN` | jamais au runtime | jamais au runtime | CLI uniquement |
| `LEGAL_*` | rendu serveur public | non | informations publiques de l'éditeur/hébergeur |

La limitation « lecture seule » de l'application web est principalement applicative : D1 ne fournit pas un utilisateur SQL distinct par Worker. Le paquet de requêtes publiques n'expose aucune mutation, et le Worker web ne reçoit jamais le binding R2.

## Développement local

- lancer les scripts depuis la racine afin que Bun charge `.env` sans dupliquer le fichier ;
- utiliser une base D1 locale et le stockage R2 local de Wrangler pour les tests courants ;
- utiliser `DEV_AUTH_EMAIL` uniquement lorsque le runtime confirme l'environnement `development` ;
- ne jamais pointer les tests automatisés vers D1 ou R2 de production ;
- les tests qui vérifient seulement le contrat d'environnement contrôlent les noms et la présence, jamais les valeurs.

## Production

- les identifiants de ressources non secrets vivent dans `wrangler.jsonc` ou les variables Cloudflare ;
- les secrets éventuels sont ajoutés via la gestion de secrets Workers ;
- le jeton API de déploiement reste sur le poste/secret manager de l'opérateur ;
- l'application Access et la liste d'e-mails sont gérées dans Zero Trust, pas dupliquées dans le code ;
- chaque auteur autorisé nécessite deux actions cohérentes : l'ajouter à la politique Access et créer/activer son profil D1 ;
- toute rotation remplace la valeur côté Cloudflare et dans le `.env` local sans commit.

## Informations légales à fournir

Avant la mise en ligne publique, l'opérateur doit valider : identité/statut de l'éditeur, adresse, e-mail et téléphone de contact si requis, numéro d'immatriculation/TVA le cas échéant, directeur de publication et coordonnées de l'hébergeur. La documentation technique n'est pas un avis juridique ; la page finale doit refléter la situation réelle.

Références officielles : [variables Cloudflare Workers](https://developers.cloudflare.com/workers/configuration/environment-variables/), [validation JWT Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/) et [mentions d'un site d'entrepreneur individuel](https://entreprendre.service-public.fr/vosdroits/F31228).

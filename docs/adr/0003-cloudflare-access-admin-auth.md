# ADR-0003 — Cloudflare Access et rôles applicatifs pour l'admin

- Statut : accepté
- Date : 2026-09-01

## Contexte

Le back-office est réservé à l'éditeur et quelques auteurs connus. Il n'existe ni inscription publique, ni récupération de mot de passe, ni invitation automatisée. Un système d'authentification complet dans l'application augmenterait le code sensible et la maintenance.

Cloudflare Access sait limiter un hostname à une liste exacte d'adresses e-mail. Cette barrière ne suffit toutefois pas à autoriser les actions métier : le Worker doit vérifier le jeton et déterminer ce que l'auteur peut modifier.

## Décision

- Une application Access de type self-hosted protège le hostname admin avec une politique d'adresses e-mail exactes.
- Le Worker admin valide `Cf-Access-Jwt-Assertion` avec la clé publique Access, l'émetteur et `ACCESS_AUD`.
- L'e-mail vérifié est normalisé puis associé à un auteur D1 actif.
- Le rôle D1 est `admin` ou `author`.
- Un auteur ne peut lire/muter que ses propres publications ; un admin peut gérer tous les contenus, auteurs et référentiels.
- `DEV_AUTH_EMAIL` fournit une identité locale seulement en environnement `development`.
- Ajouter un auteur reste une opération manuelle en deux étapes : politique Access puis profil D1.

## Conséquences

- Aucun mot de passe, session ou secret d'authentification utilisateur n'est stocké par Jouzy.
- Une adresse présente dans Access mais absente/désactivée dans D1 reçoit un refus applicatif.
- Toute mutation doit appliquer une autorisation serveur ; masquer un bouton ne suffit jamais.
- Le mode local doit échouer fermé s'il est activé hors développement.

## Alternatives écartées

- Better Auth ou autre auth applicative : trop de surface pour une petite whitelist.
- Faire confiance uniquement au proxy Access : ne couvre pas les rôles ni la validation défense en profondeur.
- Gérer la politique Access via API dans l'admin : permissions Cloudflare et complexité inutiles en V1.

## Références

- [Cloudflare Access application types](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/choose-application-type/)
- [Protect a Worker with Cloudflare Access](https://developers.cloudflare.com/workers/configuration/cloudflare-access/)
- [Validate the Access JWT](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/)

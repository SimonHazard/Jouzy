# ADR-0005 — Mesure d'audience sobre et médias tiers sur action

- Statut : accepté
- Date : 2026-09-01

## Contexte

Le site est public et ne possède aucun compte lecteur. Une mesure d'audience basique est utile, mais PostHog et un bandeau de consentement global seraient disproportionnés. Les iframes YouTube, Spotify et autres peuvent en revanche contacter un tiers dès leur chargement.

## Décision

- Cloudflare Web Analytics est l'unique mesure d'audience V1.
- Aucun PostHog, pixel publicitaire, fingerprinting ou outil de session replay n'est ajouté.
- Chaque média tiers est rendu comme un placeholder local ; aucune requête vers le fournisseur n'a lieu avant le clic « Charger ce contenu externe ».
- Le clic charge uniquement cet élément pour la page courante. Il n'est pas conservé en cookie ou stockage local comme consentement global.
- La page de confidentialité décrit Web Analytics, l'hébergement Cloudflare, le stockage local du thème et les effets du chargement d'un fournisseur externe.
- Les mentions légales et la politique de confidentialité restent accessibles depuis chaque page.

## Conséquences

- Le site peut éviter un gestionnaire de consentement tant qu'aucun autre traceur non exempté n'est ajouté et que l'analyse réelle le confirme.
- Ajouter un fournisseur analytique ou charger automatiquement un embed exige une nouvelle analyse CNIL et probablement un nouvel ADR.
- Les tests réseau doivent prouver qu'aucun domaine tiers d'embed n'est contacté avant le clic.
- Ce document fixe une décision technique, pas un avis juridique ; le texte publié doit correspondre aux traitements réels.

## Alternatives écartées

- PostHog : fonctionnalités et traitements inutiles pour les besoins V1.
- Bandeau global : friction sans finalité tant que les embeds restent bloqués individuellement.
- Chargement automatique en mode « privacy enhanced » : contacte tout de même un tiers avant le choix du lecteur.

## Références

- [Cloudflare Web Analytics overview](https://developers.cloudflare.com/web-analytics/about/)
- [Cloudflare Web Analytics data collection](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/)
- [CNIL — FAQ cookies et autres traceurs](https://cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ)
- [CNIL — outils de mesure d'audience](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience)

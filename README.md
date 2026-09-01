# Jouzy

Jouzy est un blog éditorial indépendant consacré aux jeux vidéo. Le site public sert uniquement à lire et découvrir des articles ; la rédaction et la publication passent par une application d'administration séparée, réservée à une petite liste d'auteurs.

> État du dépôt : **conception validée, implémentation non commencée**. Le dépôt contient pour l'instant la documentation de référence, les décisions d'architecture et les plans à confier aux agents d'exécution.

## Principes produit

- priorité au texte, aux images et à une lecture confortable ;
- aucun compte lecteur, commentaire, abonnement, paiement, publicité ou newsletter en V1 ;
- trois formats : review, premières impressions et article ;
- éditeur Markdown avec prévisualisation, sans MDX ni HTML arbitraire ;
- médias image dans Cloudflare R2 ; vidéos et musiques intégrées depuis des services externes après action explicite du lecteur ;
- publication manuelle : brouillon, aperçu privé, publication ou dépublication ;
- interface française, préparée pour d'autres langues avec Paraglide JS ;
- thèmes système, clair, sombre et Solarized.

Le périmètre fonctionnel complet est décrit dans [docs/PRODUCT.md](docs/PRODUCT.md).

## Stack cible

| Domaine | Choix |
|---|---|
| Monorepo | TypeScript strict, Bun, Better-T-Stack pour le scaffold initial |
| Applications | Deux applications TanStack Start : `apps/web` et `apps/admin` |
| Interface | Tailwind CSS et composants shadcn/ui classiques |
| Hébergement | Cloudflare Workers, configurés avec Wrangler |
| Données | Cloudflare D1 et Drizzle ORM |
| Médias | Cloudflare R2, servi par domaine personnalisé |
| Administration | Cloudflare Access par liste exacte d'adresses e-mail, puis rôles applicatifs `admin`/`author` |
| Internationalisation | Paraglide JS, français uniquement en V1 |
| Mesure d'audience | Cloudflare Web Analytics |
| Qualité | Biome, TypeScript, Vitest ; vérifications de navigation réelles pour les parcours critiques |

Le choix de Wrangler à la place de la couche Alchemy proposée actuellement par Better-T-Stack est expliqué dans [ADR-0006](docs/adr/0006-wrangler-over-alchemy.md).

## Architecture cible

```text
apps/
  web/       # site public TanStack Start, lecture D1
  admin/     # back-office TanStack Start, lecture/écriture D1 et R2
packages/
  config/    # configuration TypeScript/Biome partagée
  content/   # rendu Markdown et embeds contrôlés partagés
  db/        # schéma Drizzle, migrations et accès D1
  domain/    # validations et règles métier sans dépendance UI
  ui/        # composants shadcn/ui partagés
docs/        # produit, architecture, données, design, environnement et ADR
plans/       # plans d'implémentation exécutables dans l'ordre
```

Il n'y a pas d'API autonome en V1. Les fonctions serveur de chaque application accèdent directement aux bindings Cloudflare dont elles ont besoin. Voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Exécution du projet

Les travaux sont découpés dans [plans/README.md](plans/README.md). La règle de livraison est : **un plan, un agent, une branche, un commit, un push**. Un agent doit lire [AGENTS.md](AGENTS.md) et le plan complet avant toute modification.

La CI/CD est volontairement différée. Le dernier plan couvre uniquement le provisionnement et la mise en ligne manuels nécessaires à la V1.

## Comptes et variables d'environnement

Les valeurs locales sont centralisées dans un fichier racine `.env`, ignoré par Git. Seuls les noms de variables et des valeurs factices sont versionnés dans `.env.example`. Les secrets de production seront configurés dans Cloudflare, pas copiés depuis `.env` dans le dépôt.

La liste exacte des comptes, ressources et variables à fournir se trouve dans [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md). Aucun secret réel ne doit apparaître dans la documentation, les plans, les logs ou les commits.

## Documentation

- [Produit](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Modèle de données](docs/DATA_MODEL.md)
- [Design et accessibilité](docs/DESIGN.md)
- [Environnements et secrets](docs/ENVIRONMENT.md)
- [Décisions d'architecture](docs/adr/README.md)
- [Plans d'implémentation](plans/README.md)

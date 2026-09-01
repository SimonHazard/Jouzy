# Plan 006 : Ajouter recherche, SEO, flux et surfaces de confiance

> **Instructions exécuteur** : compléter le site public sans changer l'éditeur ni l'architecture. Lire `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/ENVIRONMENT.md`, ADR-0004 et ADR-0005. Les pages légales doivent décrire la réalité et garder un échec explicite tant que l'opérateur n'a pas fourni ses données. Toute intégration tierce reste bloquée avant action. Exécuter chaque vérification puis modifier uniquement la ligne 006 de l'index.
>
> **Drift check — à lancer en premier** : `git diff --stat dea034b..HEAD -- apps/web packages/db packages/content packages/ui messages .env.example package.json bun.lock`
> Les plans 001–005 sont attendus. Vérifier routes publiques, renderer, thèmes et DTOs. Si des données privées ou brouillons sont déjà exposés, STOP et traiter cela comme un blocage sécurité avant d'étendre le site.

## Statut

- **Priorité** : P1
- **Effort** : L
- **Risque** : MED
- **Dépend de** : `plans/005-public-editorial-site.md`
- **Catégorie** : direction / security / perf / docs / tests
- **Planifié à** : commit `dea034b`, 2026-09-01

## Pourquoi

Une revue doit être découvrable, partageable et digne de confiance. Ce plan ajoute la recherche volontairement limitée, les métadonnées, RSS/sitemap et les pages légales, puis prouve que l'analytics et les embeds respectent le choix du lecteur. Il ferme le périmètre fonctionnel V1 avant toute mise en production.

## État actuel attendu après le plan 005

- `/`, `/articles/:slug` et `/auteurs/:slug` rendent seulement du publié et sont cachés brièvement.
- Les embeds externes sont des placeholders locaux sans iframe avant clic.
- Les thèmes et polices sont locaux ; aucune analytics n'est chargée.
- Il n'existe pas de recherche, RSS, sitemap, robots, pages légales complètes ni métadonnées riches.
- `.env.example` contient le token Web Analytics et les champs publics `LEGAL_*`, tous factices.

Contrat recherche : `q`, `type`, `platform`, `genre`, `author`, `page`; recherche seulement titre d'article, titre de jeu, prénom/nom/pseudo auteur ; ordre `publishedAt DESC, id DESC`; 12 résultats par page, maximum 24 ; aucun corps Markdown.

Contrat confidentialité : Cloudflare Web Analytics seul, aucun cookie analytique, aucun iframe/SDK/thumbnail fournisseur avant clic, et aucune persistance du choix d'embed.

## Commandes nécessaires

| But | Commande | Résultat attendu |
|---|---|---|
| Tests recherche | `bun run test -- packages/db/src/queries/public/search.test.ts apps/web/src/routes/recherche` | exit 0 |
| Tests SEO/flux | `bun run test -- apps/web/src/features/seo apps/web/src/routes/rss apps/web/src/routes/sitemap` | exit 0 |
| Tests confiance | `bun run test -- apps/web/src/features/privacy packages/content/src/embeds` | exit 0 |
| Build web | `bun run --cwd apps/web build` | exit 0 |
| Vérification globale | `bun run check` | exit 0 |

Les filtres de test peuvent être adaptés au runner du plan 001 uniquement si les chemins réels gardent les mêmes responsabilités.

## Outils conseillés

- Utiliser `cloudflare`/`workers-best-practices` pour Web Analytics et headers, `shadcn` pour les contrôles de recherche, `web-design-guidelines` pour la vérification accessibilité si disponibles.
- Références : [Web Analytics](https://developers.cloudflare.com/web-analytics/about/), [collecte Web Analytics](https://developers.cloudflare.com/web-analytics/data-metrics/data-origin-and-collection/), [CNIL mesure d'audience](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience), [CNIL FAQ cookies](https://cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ) et [mentions obligatoires](https://entreprendre.service-public.fr/vosdroits/F31228).
- Les textes légaux techniques ne remplacent pas une validation adaptée au statut réel de l'éditeur.

## Scope

**Dans le scope** :

- `packages/db/src/queries/public/search.ts` et tests ;
- route/composants recherche dans `apps/web/src/routes/recherche.tsx` et `features/search/**` ;
- `apps/web/src/features/seo/**`, métadonnées des routes existantes ;
- endpoints/routes `rss.xml`, `sitemap.xml`, `robots.txt` ;
- routes `mentions-legales.tsx`, `confidentialite.tsx` et config serveur légale ;
- `apps/web/src/features/analytics/**`, headers sécurité/confidentialité ;
- tests complémentaires dans `packages/content/src/embeds/**` ;
- navigation/footer public, `messages/fr.json`, `.env.example`, `package.json`, `bun.lock` si nécessaires ;
- la ligne 006 de `plans/README.md`.

**Hors scope** :

- changement du modèle d'article, de l'admin, de l'upload ou de la grammaire Markdown ;
- recherche dans le corps, FTS, Algolia/Meilisearch ou API de jeux ;
- newsletter, formulaire de contact, cookie banner ou gestionnaire de consentement ;
- autre analytics, session replay, pixel, publicité ou SDK social ;
- contenu légal inventé ou valeur réelle ajoutée au dépôt ;
- provisionnement Cloudflare, domaine, Access ou déploiement (plan 007).

## Workflow Git

- Créer `codex/006-discovery-seo-privacy` depuis la livraison 005.
- Un seul commit : `plan(006): complete discovery and trust surfaces`.
- Pousser après vérification ; ne pas ouvrir de PR, fusionner, déployer ou commencer le plan 007.

## Étapes

### 1. Implémenter la requête de recherche publique

Créer un schéma de paramètres partagé : chaînes trimées, enums allowlistés, page positive bornée. Normaliser `q` comme le texte indexé et échapper `%`, `_` et le caractère d'échappement avant tout `LIKE`. Toutes les valeurs restent paramétrées Drizzle/SQL.

La requête part de `articles` publiés et combine `EXISTS`/jointures pour : titre d'article, jeux associés, prénom/nom/display name auteur. Les filtres type, plateforme, genre et auteur sont facultatifs et combinables. Sélectionner uniquement le DTO léger de carte et calculer le nombre/pagination sans charger corps, embeds, liens complets ou champs privés.

L'ordre est stable `publishedAt DESC, id DESC`. Une requête vide retourne tout le flux filtrable ; caractères spéciaux ne deviennent pas des wildcards implicites. Page trop grande renvoie une page vide avec métadonnées cohérentes, pas une requête non bornée.

**Vérifier** : tests D1 avec accents/casse, `%`/`_`/apostrophe, titre/jeu/auteur, chaque filtre puis combinaison, brouillon exclu, ordre égalité et page hors plage.

### 2. Construire `/recherche` piloté par l'URL

Ajouter le lien recherche à l'en-tête. La route lit/valide les search params côté serveur, appelle la requête et rend formulaire GET, résultats et pagination. L'URL est la source de vérité ; pas de store global ni état qui diverge avec retour/rechargement.

Utiliser `Field`, `Input`, `Select`, `Button`, `Badge`, `Skeleton` et états vides. Les labels existent hors placeholder. Sur mobile, les filtres restent accessibles sans Sheet si une simple pile suffit. Le bouton effacer conserve une URL propre.

Ajouter un titre et résumé du nombre de résultats, avec annonce accessible après navigation. Marquer les pages de recherche `noindex,follow` et ne pas les cacher publiquement (`Cache-Control: private, no-store` ou équivalent Workers adapté).

**Vérifier** : tests navigation URL, filtre combiné, reset, page, erreur de paramètre normalisée, clavier et noindex/no-store.

### 3. Centraliser métadonnées et URLs canoniques

Créer une config de site serveur validée pour `PUBLIC_SITE_URL` et `R2_PUBLIC_BASE_URL`, sans fallback de production inventé. Créer des helpers SEO qui construisent title, description, canonical, Open Graph et Twitter cards sans concaténation d'URL fragile.

Appliquer :

- accueil avec identité Jouzy ;
- article avec titre, chapô, image, auteur, dates et canonical courant ;
- auteur avec bio courte et avatar ;
- 404/noindex ; recherche/noindex ; pages légales indexables.

Ajouter JSON-LD sérialisé par `JSON.stringify` dans un composant sûr : `Article` par défaut, `Review` pour une review notée avec `reviewRating` 0–10 et `itemReviewed` de type `VideoGame`. Ne jamais interpoler du Markdown/HTML brut dans un script.

**Vérifier** : tests d'URL absolue, caractères spéciaux empêchant fermeture de script, article sans image/note, review notée et canonical après ancien slug.

### 4. Ajouter RSS, sitemap et robots

Créer `/rss.xml` avec les 20 publications les plus récentes : titre, URL canonique, auteur, date, type et chapô en texte échappé. Ne pas inclure le corps complet ni les iframes. Content-Type et cache public explicites.

Créer `/sitemap.xml` avec accueil, toutes les publications publiées, profils auteurs ayant au moins une publication et pages légales. Utiliser `updatedAt` en `lastmod` lorsque pertinent. Exclure admin, recherche, brouillons, anciens slugs et aperçus.

Créer `/robots.txt` autorisant le public, interdisant explicitement toute URL admin si les domaines se recouvrent un jour, et référant le sitemap absolu. Aucun crawl de l'admin ne doit dépendre uniquement de robots : Access reste la sécurité.

**Vérifier** : parse XML des deux flux, content types, URL absolues, caractères échappés, limite RSS 20 et absence de brouillon/admin/recherche/ancien slug.

### 5. Créer mentions légales et confidentialité depuis une config validée

Créer une config serveur typée qui lit les champs `LEGAL_*` documentés. En développement, une valeur `replace-me` affiche clairement « configuration légale incomplète » sans inventer d'identité. En production, la validation doit faire échouer le check de configuration avant déploiement ; le plan 007 fournit les valeurs via Cloudflare.

`/mentions-legales` rend : éditeur/statut/adresse/contact/immatriculation et TVA si applicables, directeur de publication, hébergeur et propriété intellectuelle/liens. Ne pas ajouter CGV puisqu'il n'y a aucune vente.

`/confidentialite` rend en langage simple : responsable/contact, hébergement et données techniques Cloudflare, finalités/base légale/destinataires/durée selon les informations réellement confirmées, droits et plainte CNIL, préférence thème locale, Web Analytics, et liste des fournisseurs externes qui ne sont contactés qu'après clic. Indiquer que charger un contenu soumet ensuite la requête à la politique du fournisseur.

Ajouter ces liens au footer de chaque page. La date de mise à jour est explicite et vient d'une constante versionnée, pas de `Date.now()`.

**Vérifier** : tests avec config complète/incomplète, champs conditionnels, liens footer et absence de `replace-me` autorisée dans un build marqué production.

### 6. Intégrer Cloudflare Web Analytics uniquement en production

Créer un composant serveur qui inclut le beacon officiel Cloudflare uniquement si `ENVIRONMENT === 'production'` et `PUBLIC_WEB_ANALYTICS_TOKEN` est présent/validé. Le token est public mais ne doit pas être confondu avec `CLOUDFLARE_API_TOKEN`. Aucun script n'est chargé en local/test/admin.

Ne pas ajouter cookie, localStorage analytique, identifiant utilisateur, événement custom ou IP côté Jouzy. Documenter dans la page confidentialité la collecte telle que décrite par la documentation Cloudflare au moment de l'implémentation ; si cette documentation contredit l'ADR-0005, STOP pour décision.

**Vérifier** : rendu local/test sans beacon, production simulée avec un seul beacon, token absent avec erreur de configuration et `rg -n "posthog|gtag|segment|mixpanel" apps packages package.json` sans résultat.

### 7. Ajouter les headers de sécurité et prouver la barrière embed

Sur le Worker web, ajouter les headers compatibles avec le rendu : `X-Content-Type-Options`, politique de referrer, permissions policy minimale, protection frame et CSP. La CSP autorise seulement self, domaine média configuré, beacon Cloudflare en production et domaines d'iframe allowlistés. Éviter `'unsafe-eval'`; si le script thème est inline, le déplacer dans un asset local stable ou utiliser un hash déterministe.

Ajouter un test composant/réseau qui garantit : aucun `iframe`, `preconnect`, image de thumbnail distante, script ou fetch fournisseur avant clic ; clic sur un embed crée uniquement sa destination canonique ; rechargement/second embed ne partage pas l'état. Dans un vrai navigateur, ouvrir un article avec un embed de chaque kind et inspecter le réseau avant/après clic.

**Vérifier** : headers présents sur 200 public sans casser les thèmes/iframes après clic ; test automatisé de barrière passe ; observation navigateur consignée dans le résultat du plan sans donnée privée.

### 8. Vérifier tout le périmètre V1 public et livrer

Exécuter un parcours navigateur : accueil -> recherche combinée -> article -> auteur -> RSS/sitemap -> mentions/confidentialité, dans les quatre thèmes et tailles 390/1440 px. Vérifier navigation clavier, zoom 200 %, noindex recherche, canonical et absence de tiers avant clic.

Lancer la suite complète. Mettre la ligne 006 sur `DONE`, committer une fois et pousser.

**Vérifier** : `bun run test && bun run check` sort 0 ; build production simulé échoue avec config légale factice et réussit avec valeurs de test non réelles ; `git diff --check` est vide ; worktree propre après commit ; branche distante présente.

## Plan de tests

- Recherche D1 : accents/casse, caractères LIKE, chaque champ/filtre, combinaisons, pagination/ordre et exclusion brouillon.
- Route recherche : URL source de vérité, reset, noindex/no-store, clavier et états vides.
- SEO : canonical/OG/JSON-LD, échappement, trois formats, ancien slug.
- RSS/sitemap/robots : XML valide, content types, limites et exclusions.
- Légal : config complète/incomplète, facultatifs, date stable, aucune valeur inventée.
- Analytics : absent local/test/admin, unique en production, distinction token public/API.
- Confidentialité embed : aucune requête/iframe avant clic, état par élément et CSP fonctionnelle.
- Navigateur réel : flux complet aux tailles mobile/bureau, quatre thèmes et zoom 200 %.

## Critères de fin

- [ ] La recherche couvre uniquement titre/jeu/auteur, filtres décidés et pagination bornée.
- [ ] Aucun brouillon/champ privé/corps complet n'entre dans les résultats, RSS ou sitemap.
- [ ] Canonical, métadonnées, JSON-LD, RSS, sitemap et robots sont valides.
- [ ] Mentions/confidentialité reflètent la stack et refusent une config production factice.
- [ ] Web Analytics est seul, production-only et sans donnée ajoutée par Jouzy.
- [ ] Aucun domaine externe d'embed n'est contacté avant le clic ; preuve automatisée et navigateur.
- [ ] Headers de sécurité fonctionnent avec thèmes, médias et embeds autorisés.
- [ ] `bun run test` et `bun run check` sortent 0.
- [ ] Aucun provisionnement/déploiement ni fonctionnalité hors V1.
- [ ] Un seul commit est poussé sur `codex/006-discovery-seo-privacy`.

## Conditions STOP

- Une requête recherche doit analyser le corps ou ajouter FTS/service externe pour fonctionner.
- La documentation Cloudflare Web Analytics courante indique cookies/stockage ou traitement incompatible avec ADR-0005.
- Les informations légales obligatoires ne peuvent pas être représentées sans décision opérateur : garder le check bloquant, ne pas inventer.
- La CSP nécessite `'unsafe-eval'` ou un domaine générique non allowlisté.
- Un fournisseur émet une requête avant clic via thumbnail, preconnect, SDK ou SSR.
- Un flux/canonical peut exposer un brouillon, ancien slug ou hostname admin.
- Une vérification échoue deux fois ou exige modification admin/schéma/déploiement hors scope.

## Notes de maintenance

- Toute nouvelle intégration tierce doit mettre à jour allowlist, CSP, tests réseau et confidentialité avant activation.
- Revalider périodiquement les affirmations Web Analytics/CNIL ; elles peuvent évoluer.
- En revue, inspecter les requêtes SQL avec `%`, `_`, apostrophes et filtres combinés.
- Le plan 007 ne doit pas réécrire ces pages : il injecte les valeurs réelles, vérifie et déploie.

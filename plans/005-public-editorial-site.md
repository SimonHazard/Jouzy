# Plan 005 : Construire l'expérience éditoriale publique

> **Instructions exécuteur** : construire seulement l'accueil, la lecture et les profils auteurs à partir des contrats existants. Lire `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/DESIGN.md`, `docs/DATA_MODEL.md`, ADR-0001, ADR-0004 et ADR-0005. Réutiliser `ArticleContent`; ne pas refaire le parseur ou l'éditeur. Toutes les lectures publiques excluent les brouillons. Exécuter chaque vérification puis modifier uniquement la ligne 005 de l'index.
>
> **Drift check — à lancer en premier** : `git diff --stat dea034b..HEAD -- apps/web packages/content packages/db packages/ui messages package.json bun.lock`
> Les plans 001–004 doivent être présents et `DONE`. Comparer les exports DB/content réels à « État actuel » ; si un DTO ou renderer essentiel manque, STOP et rapporter le contrat absent.

## Statut

- **Priorité** : P1
- **Effort** : L
- **Risque** : MED
- **Dépend de** : `plans/004-editorial-workflow.md`
- **Catégorie** : direction / perf / tests
- **Planifié à** : commit `dea034b`, 2026-09-01

## Pourquoi

Ce plan transforme la chaîne éditoriale en un site réellement lisible, sans encore ajouter tout le catalogue SEO/recherche. Il fixe l'identité visuelle simple, les quatre préférences de thème, la hiérarchie des contenus et les requêtes publiques sûres. La séparation garde la review centrée sur le texte au lieu de noyer la première version sous des fonctions de portail média.

## État actuel attendu après le plan 004

- Des articles peuvent être brouillons, publiés puis dépubliés ; les redirections de slug sont enregistrées.
- `packages/content` expose le renderer sûr `ArticleContent` et le placeholder d'embed sans requête tierce initiale.
- `packages/db` contient uniquement les requêtes admin pour les articles ; `queries/public` est encore vide ou minimal.
- `apps/web` ne contient que la page de scaffold et possède le binding D1, jamais R2.
- Les tokens shadcn sont basiques ; aucun layout public, thème Solarized ou typographie éditoriale n'est finalisé.

Contrats publics :

- seule une ligne `articles.status = 'published'` peut être retournée ; `publishedAt` doit être non nul ;
- désactiver l'accès admin d'un auteur ne dépublie pas ses articles ni son profil public ;
- les URL média sont construites depuis `R2_PUBLIC_BASE_URL` + clé, avec encodage des segments ;
- les pages publiées utilisent `Cache-Control: public, s-maxage=60, stale-while-revalidate=600` ; les erreurs et aperçus ne sont pas cachés ;
- aucun appel runtime au Worker admin.

## Commandes nécessaires

| But | Commande | Résultat attendu |
|---|---|---|
| Tests requêtes | `bun run test -- packages/db/src/queries/public` | exit 0 |
| Tests web | `bun run test -- apps/web` | exit 0 |
| Build web | `bun run --cwd apps/web build` | exit 0 |
| Vérification globale | `bun run check` | exit 0 |

## Outils conseillés

- Utiliser les skills `shadcn`, `frontend-design` ou `minimalist-ui` si disponibles, sans contredire `docs/DESIGN.md`.
- Consulter la documentation TanStack Start courante pour loaders, headers et erreurs ; [hosting](https://tanstack.com/start/latest/docs/framework/react/guide/hosting) et [ISR](https://tanstack.com/start/latest/docs/framework/react/guide/isr).
- Les composants shadcn officiels existants sont la base. Ne pas installer une bibliothèque de design, animation ou carousel.

## Scope

**Dans le scope** :

- `apps/web/src/routes/__root.tsx`, `index.tsx`, `articles/$slug.tsx`, `auteurs/$slug.tsx` et routes d'erreur associées ;
- `apps/web/src/components/**`, `src/styles/**`, `src/features/theme/**`, loaders/server publics ;
- `packages/db/src/queries/public/articles.ts`, `authors.ts` et tests ;
- adaptations de rendu/styles dans `packages/content/**` sans changer la grammaire ;
- tokens/compositions partagés dans `packages/ui/**` ;
- `messages/fr.json`, `package.json`, `bun.lock` pour polices/dépendances strictement nécessaires ;
- la ligne 005 de `plans/README.md`.

**Hors scope** :

- recherche/filtres, RSS, sitemap, robots, JSON-LD complet, analytics et pages légales (plan 006) ;
- page dédiée d'un jeu ;
- toute mutation, route admin, preview ou binding R2 dans le web ;
- modification de syntaxe Markdown, upload ou schéma D1 ;
- tracking, commentaire, compte lecteur, newsletter, publicité ou recommandation algorithmique ;
- déploiement et domaine.

## Workflow Git

- Créer `codex/005-public-editorial-site` depuis la livraison 004.
- Un seul commit : `plan(005): build the public editorial experience`.
- Pousser après vérification ; ne pas ouvrir de PR, fusionner, déployer ou commencer le plan 006.

## Étapes

### 1. Créer les requêtes publiques projetées

Dans `packages/db/src/queries/public`, implémenter des requêtes paramétrées avec sélections explicites, jamais `select *` :

- `getHomePage({ page, pageSize })` : article featured publié (ou le plus récent), publications récentes puis flux chronologique ;
- `getPublishedArticleBySlug(slug)` : article, auteur, jeux, taxonomies, liens, médias et embeds ;
- `getSlugRedirect(oldSlug)` : cible active publiée uniquement ;
- `getPublicAuthorBySlug(slug, page, pageSize)` : profil public et ses publications ;
- `getRelatedPublishedArticles(articleId, gameIds, limit)` : review finale/premières impressions puis même jeu, ordre déterministe.

Toutes les requêtes commencent par le filtre `status='published'` et vérifient `publishedAt`. La pagination est bornée (12 par défaut, 24 maximum) et triée par `publishedAt DESC, id DESC`. Un article dépublié ou inexistant retourne le même résultat absent.

Les DTOs n'exposent jamais l'e-mail de connexion, statut d'accès, clé R2 brute, nom de fichier original ou donnée admin. Ils exposent une URL publique construite dans l'adaptateur serveur depuis la base configurée.

**Vérifier** : fixtures D1 avec publié/brouillon/dépublié, auteur disabled après publication, ancien slug et contenus reliés ; aucun brouillon/donnée privée dans les snapshots DTO.

### 2. Établir les thèmes et la typographie

Dans les tokens globaux partagés, définir clair, sombre et Solarized comme palettes complètes de tokens sémantiques shadcn. Solarized est une palette sombre distincte. Aucun composant ne reçoit de couleur `dark:` ad hoc.

Créer une feature thème offrant `system`, `light`, `dark`, `solarized`. La valeur est stockée uniquement dans `localStorage`; aucun cookie/serveur. Un petit script de démarrage applique l'attribut de thème avant le rendu pour éviter le flash, avec fallback système et gestion d'une valeur invalide. Le sélecteur est un groupe/menu accessible et annonce la valeur courante.

Utiliser `Source Serif 4 Variable` pour titres/corps éditorial et `Inter Variable` pour navigation/métadonnées/admin, auto-hébergées via des paquets Fontsource ou des fichiers locaux versionnés. Vérifier les glyphes français et ne charger que les graisses/styles utilisés. Si ces paquets n'existent plus ou imposent un CDN, STOP avant de choisir une autre paire.

**Vérifier** : tests des quatre choix, fallback système, valeur invalide et hydratation sans mismatch ; aucune requête de police externe dans le build.

### 3. Construire le layout public

Remplacer le scaffold par un document sémantique : lien d'évitement, en-tête, `main`, pied de page. L'en-tête montre logo texte Jouzy, accès accueil et sélecteur de thème ; la recherche sera ajoutée au plan 006, sans faux bouton. Aucun lien de connexion public.

Le pied de page réserve des liens fonctionnels futurs vers mentions/confidentialité seulement lorsqu'ils existent au plan 006 ; dans ce plan, ne créer ni lien mort ni placeholder légal. Ajouter une page 404 et une erreur générique sobres, sans stack trace.

Créer les primitives éditoriales dans `apps/web/src/components` : `ArticleCard`, `ArticleMeta`, `AuthorByline`, `GameMeta`, `Score`, `Verdict`, `Disclosure`, `StoreLinks`, `Pagination`. Réutiliser `Card`, `Badge`, `Avatar`, `Separator`, `Button` ; ne pas forcer chaque article dans une carte bordée si la composition typographique suffit.

**Vérifier** : tests de landmarks, lien d'évitement, ordre des titres, absence de login/lien mort et noms accessibles du sélecteur.

### 4. Implémenter l'accueil

La route `/` utilise `getHomePage`. Composition : une publication mise en avant, une courte rangée des suivantes, puis flux chronologique paginé. Éviter le carousel. En absence de featured, utiliser la plus récente ; en absence de contenu, afficher un état éditorial simple sans données factices.

Chaque item affiche type traduit, titre, chapô concis, auteur, date et image si présente. La note peut apparaître discrètement pour une review, sans remplacer le verdict. La pagination produit des liens réels et conserve des pages valides ; page hors plage renvoie 404 ou la politique choisie une fois et testée.

Appliquer les headers de cache prévus seulement aux réponses réussies. Les images utilisent largeur/hauteur, `loading="lazy"` hors héro, `sizes` adapté et pas de recadrage destructif.

**Vérifier** : tests avec 0/1/plusieurs articles, featured explicite/fallback, page 2 et brouillon exclu ; header cache exact sur 200 et absent sur erreur.

### 5. Implémenter la page publication

La route `/articles/$slug` charge le DTO publié. Si absent, chercher une redirection d'ancien slug et répondre par redirection permanente vers le slug courant ; sinon 404. Ne jamais révéler qu'un brouillon existe.

Rendre dans l'ordre : format, titre, chapô, auteur, dates, jeux, couverture, éventuelle musique/embeds à leur place, corps `ArticleContent`, note/verdict, disclosure, liens boutique/affiliés et contenus reliés. Une indication « lien affilié » accompagne chaque lien concerné et la disclosure reste visible sans dépendre de la couleur.

La colonne de lecture mesure environ 65–75 caractères. Les images peuvent s'élargir sans débordement. Le composant score accepte uniquement le DTO validé et affiche `x/10` avec demi-point français. Un article sans note ne réserve aucun espace vide.

**Vérifier** : tests pour les trois formats, score entier/demi/sans score, disclosure, affiliation, slug redirect, 404 brouillon et renderer partagé. Vérifier que le DOM initial ne contient aucune iframe externe.

### 6. Implémenter le profil auteur

La route `/auteurs/$slug` affiche avatar/fallback, display name, nom complet, bio rendue avec le sous-ensemble texte/lien sûr, rôle éditorial et liens sociaux facultatifs. Elle liste les publications paginées avec le même `ArticleCard`.

Ne jamais exposer l'e-mail Access. `publicEmail`, s'il existe, est rendu explicitement comme contact public. Un auteur sans publication obtient un état vide ; un profil inconnu renvoie 404. Un auteur dont l'accès admin est disabled reste visible avec ses publications historiques.

**Vérifier** : tests confidentialité des champs, profil avec/sans avatar/liens/publications et auteur disabled.

### 7. Vérifier responsive, accessibilité et performance locale

Avec un petit jeu de données local créé via les services admin, ouvrir accueil, article long avec images/embeds et auteur à environ 390, 768 et 1440 px. Vérifier clavier, focus, zoom 200 %, absence de scroll horizontal, thèmes, rechargement sans flash visible, image manquante et reduced motion.

Contrôler le HTML/réseau : aucune requête vers fournisseur externe avant clic, aucune police distante, aucun bundle admin dans le web et aucune clé privée dans la sortie. Vérifier l'article avec JavaScript désactivé : le texte, les images et les placeholders restent lisibles.

**Vérifier** : `bun run --cwd apps/web build` sort 0 ; `rg -n "apps/admin|CLOUDFLARE_API_TOKEN|ACCESS_AUD" apps/web/.output apps/web/dist 2>/dev/null` ne trouve aucune fuite (adapter uniquement le chemin de sortie réel du scaffold).

### 8. Lancer la suite et livrer

Exécuter tous les tests et builds. Mettre la ligne 005 sur `DONE`, vérifier le scope, créer le commit unique et pousser.

**Vérifier** : `bun run test && bun run check` sort 0 ; `git diff --check` est vide ; worktree propre après commit ; branche distante présente.

## Plan de tests

- Requêtes D1 : filtrage systématique published, ordre/pagination, redirection et DTO sans champs privés.
- Thème : quatre options, système, localStorage invalide, hydratation et changement OS.
- Layout : landmarks, skip link, focus, erreurs et aucune connexion publique.
- Accueil : empty state, featured, flux, pagination et cache.
- Article : trois formats, médias, embeds placeholder, score/verdict, disclosure, affiliation, relations et 404/redirect.
- Auteur : confidentialité, bio/liens sûrs, pagination et auteur disabled.
- Navigateur réel : 390/768/1440 px, clavier, 200 %, thèmes, JS désactivé pour la lecture essentielle.

## Critères de fin

- [ ] Accueil, publication et profil auteur fonctionnent sur D1 local avec uniquement les contenus publiés.
- [ ] Les anciens slugs redirigent et les brouillons sont indistinguables d'un contenu absent.
- [ ] Les quatre préférences de thème fonctionnent sans cookie ni flash majeur.
- [ ] Typographie auto-hébergée, design simple et tokens sémantiques sans palette locale.
- [ ] Le renderer partagé affiche Markdown, images et placeholders sans HTML/iframe initiale.
- [ ] Aucun champ privé auteur, binding R2 ou code admin n'est livré au web.
- [ ] Headers cache exacts sur pages réussies et parcours responsive/accessibles vérifiés.
- [ ] `bun run test` et `bun run check` sortent 0.
- [ ] Aucun élément du plan 006 ou déploiement n'a été anticipé.
- [ ] Un seul commit est poussé sur `codex/005-public-editorial-site`.

## Conditions STOP

- Le plan 004 n'expose pas un renderer/DTO sûr réutilisable ou les publications ne sont pas transactionnelles.
- Une requête publique nécessite d'exposer un e-mail de connexion, une clé R2 ou un champ admin.
- Le cache TanStack/Workers courant ne permet pas de fixer les headers sans cacher des erreurs/brouillons.
- Les polices choisies ne peuvent pas être auto-hébergées avec les glyphes français.
- Un rendu exige `dangerouslySetInnerHTML`, une iframe serveur initiale ou une requête vers l'admin.
- Une route publique peut retourner un brouillon/dépublié dans un test.
- Une vérification échoue deux fois ou exige recherche/SEO/analytics/déploiement hors scope.

## Notes de maintenance

- Toute nouvelle requête publique doit partir du filtre published et projeter explicitement les champs.
- Le cache court remplace volontairement une purge API ; l'admin prévient du délai d'environ une minute.
- En revue, comparer le rendu aperçu/public et rechercher les imports accidentels de modules serveur/admin.
- Le plan 006 ajoutera recherche et surfaces de confiance sans changer la hiérarchie de lecture.

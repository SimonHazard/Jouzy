# Plan 004 : Livrer l'éditeur Markdown, les médias R2 et le cycle de publication

> **Instructions exécuteur** : ce plan construit le cœur éditorial, pas le site public. Lire `AGENTS.md`, `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/DESIGN.md`, ADR-0002, ADR-0003, ADR-0004 et ADR-0005. Utiliser la sécurité/rôles du plan 003 et le schéma existant sans créer un second chemin. Exécuter toutes les portes de vérification et modifier uniquement la ligne 004 de l'index. STOP face à toute ambiguïté de format ou de permission.
>
> **Drift check — à lancer en premier** : `git diff --stat dea034b..HEAD -- apps/admin packages/content packages/db packages/domain packages/ui package.json bun.lock`
> Les changements 001–003 sont attendus. Vérifier que l'identité protégée, les permissions et toutes les tables décrites existent. Si une migration métier supplémentaire semble nécessaire, STOP et expliquer pourquoi avant de l'écrire.

## Statut

- **Priorité** : P1
- **Effort** : L
- **Risque** : HIGH
- **Dépend de** : `plans/003-access-admin-reference-data.md`
- **Catégorie** : direction / security / tests
- **Planifié à** : commit `dea034b`, 2026-09-01

## Pourquoi

La valeur de Jouzy est de publier des articles facilement sans sacrifier sécurité ou rendu. Ce plan fournit un chemin complet dans l'admin : créer un brouillon, écrire en Markdown, téléverser des images, prévisualiser avec le renderer final, puis publier/dépublier. La syntaxe contrôlée empêche qu'un auteur introduise du HTML, du code ou une iframe arbitraire.

## État actuel attendu après le plan 003

- L'admin valide Cloudflare Access et résout une identité D1 active.
- `canReadArticle`/`canMutateArticle` centralisent la propriété : auteur sur ses contenus, admin sur tous.
- Les auteurs, jeux et taxonomies sont consultables ; seuls les admins les modifient.
- Les tables `articles`, jointures, médias, embeds et redirections existent mais n'ont pas de services métier.
- `packages/content` est vide ; R2 est lié à l'admin par `MEDIA`, jamais au web.
- Le site public n'a encore aucune route éditoriale.

Contrat de directive V1 :

```markdown
::jouzy-image{assetId="<id>"}

::jouzy-embed{kind="video" provider="youtube" url="https://www.youtube.com/watch?v=<id>"}

::jouzy-embed{kind="music" provider="spotify" url="https://open.spotify.com/track/<id>"}
```

Le parser doit tolérer espaces/ordre d'attributs mais sérialiser une forme canonique. L'éditeur insère ces lignes ; l'auteur n'a pas à les mémoriser. HTML brut, MDX, attributs inconnus, IDs média absents, schémas non HTTPS et fournisseurs hors allowlist sont des erreurs de sauvegarde.

## Commandes nécessaires

| But | Commande | Résultat attendu |
|---|---|---|
| Installation | `bun install` | exit 0 |
| Tests contenu | `bun run test -- packages/content` | exit 0 |
| Tests média | `bun run test -- apps/admin/src/features/media` | exit 0 |
| Tests éditoriaux | `bun run test -- apps/admin/src/features/articles packages/db/src/queries/admin/articles.ts` | exit 0 |
| Migration locale | `bun run db:migrate:local` | exit 0, aucune migration inattendue |
| Vérification globale | `bun run check` | exit 0 |

## Outils conseillés

- Utiliser `shadcn` pour les composants, `cloudflare`/`workers-best-practices` pour R2 et les server functions.
- Avant de choisir une dépendance de Markdown, consulter ses docs officielles et confirmer la compatibilité Workers. La famille recommandée est `unified`, `remark-parse`, `remark-gfm`, `remark-directive`, avec rendu React contrôlé ; ne pas ajouter `rehype-raw`.
- Références : [GFM](https://github.github.com/gfm/), [R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/) et [R2 custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/).

## Scope

**Dans le scope** :

- `packages/content/**` ;
- règles article/media/embed dans `packages/domain/**` ;
- `packages/db/src/queries/admin/articles.ts`, `media.ts` et tests ;
- `apps/admin/src/features/articles/**`, `media/**` ;
- intégration du sélecteur média uniquement dans `apps/admin/src/features/authors/**` et `games/**` ;
- routes admin `_protected/articles/**` et `_protected/media/**` ;
- composants officiels/compositions nécessaires dans `packages/ui/**` ;
- `package.json`, `bun.lock` ;
- la ligne 004 de `plans/README.md`.

**Hors scope** :

- routes, requêtes ou design du site public ;
- recherche, RSS, sitemap, analytics et pages légales ;
- nouvelle table ou modification de migration sauf incohérence prouvée et validée par l'opérateur ;
- upload vidéo/audio, conversion/transformation d'image ou URL S3 présignée ;
- autosave, collaboration, historique, planification, approbation, version ou diff d'article ;
- HTML, MDX, iframe libre et fournisseur non listé ;
- API Cloudflare distante, domaine R2 public ou déploiement.

## Workflow Git

- Créer `codex/004-editorial-workflow` depuis la livraison 003.
- Un seul commit : `plan(004): build the editorial workflow`.
- Pousser après vérification ; ne pas ouvrir de PR, fusionner, déployer ou commencer le plan 005.

## Étapes

### 1. Construire le parseur Markdown sûr

Dans `packages/content/src/markdown`, créer une pipeline pure qui :

1. parse CommonMark/GFM et `remark-directive` ;
2. rejette tout nœud HTML/MDX et toute directive inconnue ;
3. valide les attributs exacts des deux directives Jouzy ;
4. valide les liens Markdown (`http`, `https`, `mailto` seulement selon contexte) et rejette `javascript:`, `data:` et URL ambiguës ;
5. produit un AST applicatif sérialisable et une liste ordonnée des références média/embed ;
6. sait sérialiser les directives dans leur forme canonique sans reformater arbitrairement tout le texte de l'auteur.

Retourner des erreurs avec ligne/colonne, code et message français. Ne jamais « nettoyer silencieusement » un fragment invalide : l'auteur doit savoir ce qui ne sera pas publié.

**Vérifier** : fixtures valides (titres, listes, tables, liens, image, sept fournisseurs) et malveillantes (HTML, script, URL `javascript:`, attribut supplémentaire, provider/domain incohérent, directive imbriquée) ; `bun run test -- packages/content` sort 0.

### 2. Normaliser les fournisseurs et créer les placeholders

Dans `packages/content/src/embeds`, créer une définition par fournisseur : domaines d'entrée autorisés, parseur d'identifiant, URL canonique, URL d'embed, libellé, `kind` permis et attributs iframe minimaux. Une URL fournisseur A déclarée provider B est rejetée.

Créer le composant partagé `ExternalEmbed` qui rend côté serveur uniquement un placeholder local contenant fournisseur, type, avertissement et bouton « Charger ce contenu externe ». L'iframe n'est créée côté client qu'après clic sur ce bouton et uniquement pour l'instance concernée. Ne pas persister le choix, préconnecter le domaine, autoplay ou charger un SDK tiers.

Utiliser `youtube-nocookie.com` lorsque compatible. Ajouter `title`, dimensions/responsive, `loading="lazy"`, `referrerPolicy` restrictif et un `sandbox`/`allow` explicitement testé par fournisseur. Un échec de chargement garde un lien externe de secours.

**Vérifier** : au rendu initial, un spy `fetch`/DOM ne voit aucune URL de fournisseur ni iframe ; après clic, une seule iframe canonique apparaît ; rechargement du composant revient au placeholder.

### 3. Rendre le contenu et les images depuis un modèle contrôlé

Créer un renderer React dans `packages/content` qui mappe uniquement les nœuds autorisés vers des composants maîtrisés. Les liens externes utilisent `rel="noopener noreferrer"`; les images reçoivent alt, légende et crédit depuis le DTO média résolu, pas depuis des attributs libres.

Le renderer reçoit une map `assetId -> { publicUrl, alt, caption, credit, width, height }`. Une référence absente produit un bloc d'erreur visible dans l'aperçu admin et empêche la publication ; elle ne produit jamais une URL construite au hasard.

Le package expose un seul `ArticleContent` utilisé plus tard par le web et maintenant par l'aperçu. Séparer les modules serveur de parsing des composants clients d'embed pour éviter de livrer le parseur complet au navigateur si inutile.

**Vérifier** : snapshot structurel des éléments autorisés, tests d'alt/légende/crédit, lien externe sûr, média absent et absence de `dangerouslySetInnerHTML` dans `packages/content`.

### 4. Implémenter l'upload et la bibliothèque d'images R2

Dans la feature serveur média admin :

- accepter uniquement JPEG, PNG, WebP et AVIF, maximum 10 Mio ;
- vérifier signature réelle/MIME, largeur et hauteur à partir des octets avec une bibliothèque confirmée compatible Workers ; ne pas faire confiance au nom ou au type navigateur ;
- exiger alt non vide, autoriser légende/crédit ;
- générer côté serveur une clé `media/<année>/<uuid>.<extension-validée>` sans fragment du nom utilisateur ;
- écrire l'objet R2 avec `Content-Type`, `Cache-Control: public, max-age=31536000, immutable` et métadonnées minimales ;
- créer ensuite `media_assets`; si la base échoue, tenter immédiatement de supprimer l'objet et retourner une erreur explicite ;
- construire l'URL publique à la volée depuis `R2_PUBLIC_BASE_URL` et la clé encodée.

Avant d'installer la bibliothèque de détection/dimensions, exécuter un test minimal dans le runtime Workers. Si elle nécessite des built-ins Node non disponibles, STOP au lieu d'activer `nodejs_compat` uniquement pour elle.

La suppression vérifie toutes les références structurées et `article_media`. Si référencé, renvoyer `CONFLICT`. Si orphelin, supprimer R2 puis D1 ; signaler un échec partiel. Pas de suppression en masse.

Créer un sélecteur média réutilisable puis compléter les formulaires existants : avatar facultatif d'un auteur et couverture facultative d'un jeu. Ces mutations gardent les permissions du plan 003 (admin uniquement) et stockent seulement le `mediaAssetId`. Ne modifier aucun autre champ/rôle de ces features.

**Vérifier** : tests avec petits fixtures JPEG/PNG/WebP/AVIF, faux MIME, signature invalide, 10 Mio exact, dépassement, alt vide, rollback R2 et refus de suppression référencée. Les formulaires auteur/jeu associent puis remplacent un asset sans exposer la clé R2. Aucun test ne contacte R2 distant.

### 5. Implémenter le service transactionnel d'articles

Créer dans `packages/db/src/queries/admin/articles.ts` des lectures/mutations explicites et dans `apps/admin/src/features/articles/article-service.server.ts` l'orchestration autorisée : list/get/create/save/publish/unpublish.

À chaque opération : résoudre identité, charger la ressource, appliquer `canReadArticle`/`canMutateArticle`, valider côté serveur puis exécuter la transaction. Un auteur créé un article dont il est propriétaire ; seul l'admin peut attribuer un autre auteur.

La sauvegarde :

- normalise le slug et empêche les collisions avec slug actif ou ancien ;
- parse le Markdown et reconstruit atomiquement `article_media`/`article_embeds` ;
- remplace relations jeux/tags/liens dans la même transaction ;
- vérifie que tous les assets existent et que tous les providers sont cohérents ;
- conserve `publishedAt` s'il a déjà été fixé.

La publication valide tous les invariants de `docs/DATA_MODEL.md`, fixe `publishedAt` seulement la première fois et garantit un seul `featured=true` en désactivant l'ancien dans la transaction. La dépublication repasse à `draft` mais conserve `publishedAt`. Un changement de slug après première publication crée `article_slug_redirects` atomiquement.

**Vérifier** : tests D1 locaux pour autorisation, sauvegarde complète/rollback, projections, collisions, première republication, dépublication, featured unique et redirection de slug.

### 6. Construire la liste et le formulaire éditorial

Créer les routes protégées : liste paginée des publications visibles, création et édition. La liste affiche statut, type, titre, jeu principal, auteur, mise à jour et actions permises. Un auteur ne reçoit même pas les données d'un autre auteur dans la requête.

Le formulaire couvre : type, titre, slug généré mais éditable, chapô, auteur (admin uniquement), jeux et jeu principal, tags, couverture, note/verdict conditionnels, review finale conditionnelle, avantage matériel, divulgation, liens et mise en avant (admin uniquement). `hasMaterialBenefit=true` ou un lien affilié rend la divulgation obligatoire. Masquer un champ conditionnel ne dispense jamais de le remettre à `null` côté serveur.

Utiliser les primitives `Field*`, `Select`, `Checkbox`, `Dialog`, `Alert`, `Badge`, `Tabs` et `Sonner`. Afficher les erreurs de validation à côté des champs et un résumé. Aucun autosave : un bouton « Enregistrer le brouillon » produit un état « Enregistré à HH:mm » uniquement après confirmation serveur.

**Vérifier** : tests de formulaire par type, rôle et erreurs ; l'auteur ne peut ni choisir un autre auteur ni mettre en avant ; données cachées forgées sont refusées côté serveur.

### 7. Ajouter l'éditeur Markdown, l'insertion média et l'aperçu privé

Construire un éditeur pragmatique autour d'un `Textarea` monospace et d'une barre de commandes minimale : titres, emphase, lien, liste, citation, image et embed. Chaque commande modifie la sélection/cursor de façon testée et garde le focus.

Le bouton image ouvre la bibliothèque/upload, collecte alt/légende/crédit, puis insère la directive canonique. Le bouton embed demande type, fournisseur et URL, affiche l'URL normalisée ou une erreur, puis insère la directive. Aucune iframe n'apparaît dans la zone d'édition.

La route protégée `/articles/:id/preview` charge l'article selon les permissions et rend `ArticleContent` avec les mêmes DTOs que le futur site public. Une bascule édition/aperçu intégrée peut pointer vers cette route ou rendre le même composant, mais ne duplique jamais le renderer.

Détecter les modifications non sauvegardées et demander confirmation avant navigation/fermeture. Respecter clavier, focus, reduced motion et mobile.

**Vérifier** : tests des commandes de textarea, insertion de directives, aperçu identique au renderer partagé, refus d'accès à l'aperçu d'un autre auteur et dialogue de sortie accessible.

### 8. Ajouter les actions publier/dépublier et vérifier bout en bout

Dans l'édition, distinguer clairement enregistrer, prévisualiser, publier et dépublier. Avant publication, montrer les erreurs bloquantes et rappeler qu'une mise à jour publique peut rester en cache environ une minute. Une confirmation est requise pour publier/dépublier, pas pour enregistrer.

Parcours navigateur réel avec D1/R2 locaux : admin crée un jeu puis une review avec image, texte, lien, embed vidéo/musique, note/verdict et divulgation ; prévisualise ; publie ; change le slug et constate la redirection enregistrée ; dépublie. Refaire comme auteur et vérifier la propriété. Vérifier qu'aucune requête fournisseur n'a lieu avant clic dans l'aperçu.

Lancer toute la suite, mettre 004 sur `DONE`, committer une fois et pousser.

**Vérifier** : `bun run db:migrate:local && bun run test && bun run check` sort 0 ; `git diff --check` est vide ; worktree propre après commit ; branche distante présente.

## Plan de tests

- Parser : syntaxe GFM, directives canoniques, erreurs positionnées et corpus malveillant.
- Providers : chaque domaine/forme URL valide, croisements provider/domaine, schémas interdits.
- Renderer : aucune injection/HTML brut, liens sûrs, alt/légende/crédit, placeholder sans iframe initiale.
- Média : formats/limites/signatures/dimensions, clé aléatoire, compensation R2, intégrité de suppression.
- Profils/jeux : choix et remplacement d'avatar/couverture avec permissions admin inchangées.
- Service articles : matrice rôle/propriété, transaction/rollback, règles des trois formats, relations, slug redirect, featured unique, publication/dépublication.
- UI : commandes de l'éditeur, validations conditionnelles, erreurs, état sauvegardé et navigation non sauvegardée.
- Navigateur : parcours complet admin et auteur à environ 390 px et 1440 px, clavier inclus.

## Critères de fin

- [ ] Un brouillon complet peut être créé, enregistré et prévisualisé par son auteur/admin.
- [ ] Le même parser/renderer sert l'aperçu et est exporté pour le futur site public.
- [ ] HTML, MDX, iframe libre, URL/provider invalide et asset absent sont rejetés côté serveur.
- [ ] Les images valides sont stockées en R2 local avec métadonnées ; limites et intégrité sont testées.
- [ ] Un admin peut associer un avatar auteur et une couverture jeu depuis la même bibliothèque média.
- [ ] Publication/dépublication, score/verdict, ownership, featured et slug redirects sont transactionnels et testés.
- [ ] Aucun contenu d'un autre auteur n'est exposé ou modifiable par un auteur.
- [ ] Aucun fournisseur externe n'est contacté avant le clic sur son placeholder.
- [ ] `bun run test` et `bun run check` sortent 0 ; parcours navigateur vérifiés.
- [ ] Aucun changement de schéma, site public ou déploiement hors scope.
- [ ] Un seul commit est poussé sur `codex/004-editorial-workflow`.

## Conditions STOP

- Plans 002/003 incomplets, table manquante ou politique de permission différente.
- Le contrat de directive exige une modification non compatible après des contenus déjà enregistrés.
- Une bibliothèque de parsing ou image impose Node-only/HTML brut/`dangerouslySetInnerHTML`.
- Les dimensions/MIME ne peuvent pas être vérifiés côté Worker sans nouvelle décision d'architecture.
- Une règle de publication ou relation contenu-jeu n'est pas définie dans les docs.
- Une route admin permettrait de contourner ownership ou validation serveur.
- La sauvegarde nécessite une mutation D1/R2 non compensable qui risque de perdre un asset référencé.
- Une vérification échoue deux fois ou nécessite le site public, un service externe ou un secret réel.

## Notes de maintenance

- La syntaxe de directive devient un format de données durable : toute évolution doit conserver les contenus existants.
- Les projections `article_media`/`article_embeds` sont reconstruites depuis le Markdown source à chaque sauvegarde.
- En revue, inspecter en priorité les frontières client/serveur, la validation répétée et les chemins de compensation R2.
- Le plan 005 doit consommer les requêtes/DTOs et `ArticleContent` existants, pas réimplémenter le rendu.

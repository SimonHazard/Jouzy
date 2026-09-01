# Instructions pour les agents

Ces règles s'appliquent à tout le dépôt Jouzy. Un fichier `AGENTS.md` plus proche d'un sous-dossier peut les préciser sans les contredire.

## Avant toute modification

1. Lire ce fichier, le plan assigné dans `plans/` et les documents/ADR qu'il cite.
2. Vérifier `git status --short --branch` et exécuter le drift check du plan.
3. Travailler uniquement sur les chemins déclarés dans le scope du plan.
4. Si le dépôt, la stack ou une hypothèse ne correspond pas au plan, **STOP et rapporter le décalage**. Ne pas inventer une architecture de remplacement.

## Contrat de livraison

- Un plan = un agent = une branche `codex/NNN-slug` = un commit = un push.
- Ne jamais regrouper deux plans dans un même changement.
- Ne pas commencer le plan suivant, ouvrir une PR, fusionner, déployer ou provisionner un service sans instruction explicite.
- Préserver les modifications utilisateur et les fichiers hors scope.
- Mettre à jour uniquement la ligne du plan concerné dans `plans/README.md` à la fin.
- Le commit unique utilise `plan(NNN): <résultat concis>` sauf instruction contraire du plan.
- Si un plan se termine sur une intervention opérateur réellement indispensable, conserver le travail vérifié, marquer le plan `BLOCKED` avec une raison d'une ligne et s'arrêter.

## Stack et limites structurantes

- Bun est le gestionnaire de paquets et l'exécuteur de scripts.
- TypeScript reste en mode strict ; ne pas introduire de `any` non justifié.
- Les deux frontends sont des applications TanStack Start déployées séparément sur Cloudflare Workers.
- Il n'y a pas de service API autonome en V1.
- D1 + Drizzle sont la source de vérité relationnelle ; toutes les évolutions de schéma passent par une migration versionnée.
- R2 stocke uniquement les images téléversées. Les vidéos et musiques restent chez leurs fournisseurs externes.
- Le site public ne possède que les droits D1 de lecture nécessaires. L'admin possède D1 en lecture/écriture et le binding R2.
- Cloudflare Access protège l'admin, mais le Worker doit aussi valider le JWT Access et appliquer le rôle `admin` ou `author` issu de D1.
- Paraglide JS est installé dès la base avec `fr` comme seule locale et sans préfixe d'URL en V1.
- CI/CD, comptes lecteurs, commentaires, newsletter, paiement, publicité, planification de publication, historique de versions, upload vidéo et API de catalogue de jeux sont hors périmètre V1.

## Règles shadcn/ui

- Utiliser uniquement les composants classiques du registre officiel shadcn/ui. Aucun registre communautaire sans accord explicite.
- Avant d'ajouter un composant, exécuter `bunx --bun shadcn@latest info`, chercher le composant puis consulter sa documentation. Respecter le style et la bibliothèque d'icônes déclarés par le projet.
- Centraliser les composants réutilisables dans `packages/ui` ; ne pas recopier le même composant dans les deux applications.
- Utiliser les tokens sémantiques et les variantes existantes. `className` sert principalement au layout ; ne pas injecter des couleurs `dark:` ad hoc dans les composants.
- Utiliser `gap-*` plutôt que `space-x-*`/`space-y-*`, `size-*` lorsque largeur et hauteur sont identiques, et `cn()` pour composer les classes.
- Ne pas définir de `z-index` arbitraire. Respecter les primitives de superposition.
- Composer les formulaires avec `FieldGroup`, `Field`, `FieldLabel`, `FieldDescription` et `FieldError` selon la documentation du composant.
- Toute boîte de dialogue, feuille ou tiroir possède un titre accessible. Utiliser `AvatarFallback`, `Separator`, `Skeleton`, `Badge` et `Spinner` plutôt que des substituts artisanaux.
- Les icônes décoratives ont `aria-hidden`; les boutons uniquement composés d'une icône ont un nom accessible. Utiliser `data-icon` conformément aux exemples shadcn.
- Ne pas supposer si les primitives sous-jacentes sont Base UI ou Radix : vérifier `components.json` et la sortie de `shadcn info`.

## Qualité d'interface

- Concevoir mobile-first, au clavier et avec des contrastes WCAG AA.
- Respecter `prefers-reduced-motion`; aucune animation n'est nécessaire sans fonction claire.
- Utiliser les quatre préférences de thème documentées : système, clair, sombre et Solarized. Les couleurs vivent dans les tokens globaux.
- Réutiliser le même moteur de rendu Markdown pour l'aperçu admin et le site public.
- Ne jamais rendre du HTML/MDX fourni par un auteur. Les embeds passent uniquement par la syntaxe contrôlée et les fournisseurs autorisés.
- Un contenu tiers n'est chargé qu'après le clic du lecteur sur son placeholder, sans consentement persistant global.

## Données, sécurité et secrets

- Le fichier racine `.env` est local et ignoré. `.env.example` contient uniquement des noms et valeurs factices.
- Ne jamais ouvrir ou afficher `.env` pour recopier ses valeurs. Laisser Bun/Wrangler charger le fichier et vérifier seulement la présence ou l'absence des variables.
- Ne jamais écrire un secret dans un plan, une documentation, un test, une fixture, une capture, un log ou un commit.
- Les secrets de production sont créés dans Cloudflare. Les bindings et identifiants non secrets sont déclarés explicitement dans la configuration Wrangler.
- Ne jamais utiliser une variable `VITE_*` pour une valeur secrète.
- Valider toutes les entrées côté serveur. Vérifier type MIME réel, taille et dimensions des images ; générer les clés R2 côté serveur.
- Les auteurs ne peuvent modifier que leurs propres contenus. Seul un admin gère les autres auteurs et tous les contenus.
- Un contenu non publié ne doit jamais être exposé par une route, un flux RSS, un sitemap ou une recherche publique.

## Vérification et documentation

- Exécuter chaque commande de vérification demandée par le plan et noter son résultat réel.
- Deux échecs consécutifs sur la même porte de vérification après une correction raisonnable imposent un STOP.
- Pour les parcours UI critiques, compléter les tests automatiques par une vérification dans un vrai navigateur aux tailles mobile et bureau.
- Mettre à jour les documents de référence lorsqu'un contrat change. Une décision structurante nouvelle ou inversée nécessite un ADR.
- Les sources officielles priment sur la mémoire du modèle pour les API et CLI susceptibles d'évoluer.

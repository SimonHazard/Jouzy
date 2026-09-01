# Design et expérience

## Direction

Jouzy doit ressembler à une revue éditoriale contemporaine : calme, typographique, dense juste ce qu'il faut et centrée sur la lecture. L'interface ne cherche pas à reproduire SynthPotato ni à ressembler à un tableau de bord SaaS générique.

Les composants shadcn/ui classiques fournissent les primitives. L'identité vient de la typographie, du rythme vertical, de la largeur de lecture, des images et des tokens de couleur, pas de décorations complexes.

## Principes

- une hiérarchie claire avant toute ornementation ;
- largeur de texte confortable, environ 65 à 75 caractères par ligne ;
- espaces réguliers et bordures discrètes ;
- pas de gradient, verre dépoli, ombre lourde ou animation gratuite ;
- images éditoriales respectées, sans recadrage destructif par défaut ;
- métadonnées secondaires visuellement présentes mais non concurrentes du titre ;
- états vides, erreurs et chargements rédigés en français naturel.

## Typographie

Le scaffold doit choisir une paire de polices librement hébergeables et performante : une sérif éditoriale pour les grands titres et le corps long, une sans-sérif pour la navigation, les métadonnées et l'admin. Elles sont auto-hébergées ou servies sans traceur tiers. Le plan d'interface doit vérifier les caractères français, italiques, graisses nécessaires et métriques de fallback avant de les figer.

## Thèmes

La préférence initiale suit le système. Le sélecteur propose ensuite :

- système ;
- clair ;
- sombre ;
- Solarized, traité comme une palette sombre éditoriale distincte.

Le choix est stocké localement dans le navigateur. Tous les thèmes partagent les mêmes tokens sémantiques shadcn (`background`, `foreground`, `card`, `muted`, `border`, `primary`, etc.). Aucun composant ne contient sa propre palette `dark:`. Un script de démarrage prévient le flash de mauvais thème et respecte le rendu serveur.

## Site public

### En-tête

Logo texte Jouzy, accès aux publications/recherche, sélecteur de thème et menu compact sur mobile. Aucun bouton de connexion public.

### Accueil

Une composition éditoriale simple : publication mise en avant, rangée des dernières publications puis liste chronologique. Les cartes utilisent image, format, titre, chapô court, auteur et date. Les filtres ne doivent pas repousser le contenu principal sous un grand panneau.

### Lecture

Le titre, le chapô et les métadonnées précèdent une couverture ample. Le corps conserve une colonne étroite ; les images peuvent l'élargir ponctuellement. La note n'est ni un badge criard ni l'unique information de la review. Le verdict reste un bloc de texte lisible.

Les liens affiliés sont identifiables sans couleur seule. Les placeholders d'embed annoncent le fournisseur et la conséquence du clic avant d'afficher le bouton.

### Recherche

Champ de recherche visible, filtres compacts et résultats paginés. L'URL représente la requête et les filtres afin que rechargement, partage et navigation arrière fonctionnent.

## Administration

L'admin privilégie la vitesse d'écriture : navigation latérale simple sur bureau, barre compacte sur mobile, tableaux lisibles, formulaires en sections et actions primaires non ambiguës.

L'éditeur propose :

- barre minimale pour titres, emphase, lien, liste, citation, image et embed ;
- vue édition et vue aperçu, avec bascule utilisable au clavier ;
- compteur et statut d'enregistrement ;
- alerte avant de quitter avec des changements non enregistrés ;
- erreurs proches du champ et résumé au début lors d'une soumission invalide.

L'aperçu utilise les mêmes composants que le site public, dans le contexte protégé de l'admin.

## Accessibilité

- HTML sémantique et ordre de titres cohérent ;
- navigation complète au clavier et focus visible ;
- contraste WCAG AA pour texte, contrôles et états ;
- cibles tactiles d'au moins 44 px lorsque possible ;
- texte alternatif requis dans le workflow média ;
- pas d'information transmise uniquement par couleur, position ou mouvement ;
- respect de `prefers-reduced-motion` ;
- dialogues, feuilles et tiroirs nommés ;
- annonces accessibles pour sauvegarde, upload et erreurs asynchrones.

## Responsive

Les points de rupture répondent au contenu plutôt qu'à des appareils précis. Les vérifications manuelles minimales utilisent environ 390 px, 768 px et 1440 px. Une publication doit rester lisible avec zoom à 200 % et sans débordement horizontal causé par le Markdown ou un embed.

## Usage shadcn/ui

Les règles détaillées sont dans [AGENTS.md](../AGENTS.md). En particulier : registre officiel uniquement, tokens sémantiques, composants partagés dans `packages/ui`, formulaires composés avec les primitives `Field`, et consultation de `shadcn info`/documentation avant ajout.

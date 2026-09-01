# Produit

## Vision

Jouzy est la maison éditoriale d'un journaliste-écrivain indépendant consacré aux jeux vidéo. Le produit optimise la qualité de lecture et la facilité de publication, pas l'acquisition, la monétisation ou l'engagement artificiel.

Le ton, l'identité et le contenu restent propres à Jouzy. [SynthPotato](https://www.synthpotato.com/) sert uniquement de repère sur la variété des formats éditoriaux ; son design ne doit pas être copié.

## Objectifs V1

- publier des textes longs illustrés sans dépendre d'un CMS externe ;
- donner aux lecteurs une navigation rapide, lisible et accessible ;
- permettre à une petite liste d'auteurs de préparer, prévisualiser et publier leurs propres textes ;
- structurer les jeux, auteurs, plateformes, genres et liens pour rendre le fonds consultable ;
- conserver une architecture simple qui supporte davantage de contenus et de trafic sans migration immédiate.

## Hors objectifs V1

- publicité, affiliation automatique ou monétisation ;
- compte lecteur, commentaire, réaction, favoris ou personnalisation serveur ;
- abonnement payant ou gratuit, newsletter et notifications ;
- workflow de validation éditoriale, publication programmée ou historique de versions ;
- upload ou transcodage vidéo ;
- import automatique depuis IGDB, RAWG ou une autre base de jeux ;
- application mobile, API publique, moteur de recommandation ou recherche plein texte dans le corps ;
- CI/CD automatisée.

Les liens affiliés restent possibles au cas par cas, à condition d'être explicitement marqués et accompagnés de la divulgation éditoriale correspondante.

## Utilisateurs

### Lecteur

Il consulte le site sans compte, découvre les publications les plus récentes, filtre le fonds, lit un contenu et choisit éventuellement de charger un média externe.

### Auteur

Son adresse e-mail figure dans Cloudflare Access et dans un profil auteur actif. Il crée, modifie, prévisualise, publie et dépublie uniquement ses propres contenus. Il peut utiliser les jeux et taxonomies existants, sans administrer les autres auteurs.

### Administrateur

Il possède les mêmes capacités qu'un auteur sur tous les contenus, et gère les auteurs, jeux, genres, plateformes et tags.

## Formats éditoriaux

### Review

- titre, chapô, corps Markdown et auteur ;
- un jeu principal obligatoire ;
- image de couverture obligatoire avant publication ;
- note facultative sur 10 par incréments de 0,5 ;
- verdict obligatoire lorsqu'une note existe ;
- zéro ou plusieurs liens d'achat ou de boutique, affiliés ou non ;
- divulgation obligatoire lorsque le jeu, le voyage ou un autre avantage a été fourni.

### Premières impressions

- mêmes champs éditoriaux principaux ;
- un jeu principal obligatoire ;
- aucune note ;
- lien facultatif vers la review finale publiée du même jeu.

### Article

- format libre pour analyse, chronique, rétrospective, entretien ou dossier ;
- association facultative à un ou plusieurs jeux ;
- classement par tags plutôt que multiplication de sous-types applicatifs.

## Contenu d'une publication

Le corps est du Markdown enrichi par deux directives contrôlées insérées par l'éditeur :

- une directive image qui référence un asset R2 enregistré en base ;
- une directive embed qui référence une URL validée chez un fournisseur autorisé.

Le HTML arbitraire, MDX, JavaScript et les iframes écrites manuellement sont interdits. L'aperçu admin et la page publique utilisent exactement le même parseur et le même rendu.

Fournisseurs V1 : YouTube et Vimeo pour la vidéo ; Spotify, Apple Music, YouTube Music, Bandcamp et SoundCloud pour la musique. Une publication peut proposer une musique d'accompagnement sans la lancer automatiquement.

## Cycle de publication

```text
brouillon -> aperçu privé -> publié -> éventuellement dépublié
```

- un brouillon possède une URL d'aperçu uniquement dans l'admin ;
- la publication est une action manuelle et atomique qui fixe `publishedAt` lors de la première publication ;
- une modification ultérieure conserve cette date et met à jour `updatedAt` ;
- une dépublication retire immédiatement le contenu des requêtes publiques ;
- un changement de slug après première publication crée une redirection permanente de l'ancien slug vers le nouveau ;
- il n'existe ni état « en revue » ni approbateur en V1.

## Site public

### Accueil `/`

- une publication récente mise en avant ;
- quelques publications précédentes ;
- un flux chronologique paginé ;
- un accès clair à la recherche et aux filtres.

La mise en avant reste manuelle et facultative. À défaut, la publication la plus récente est utilisée.

### Publication `/articles/:slug`

- titre, format, chapô, auteur, date de publication et date de mise à jour si pertinente ;
- jeu principal et note/verdict selon le format ;
- image de couverture puis corps éditorial ;
- musique associée et embeds externes sous forme de placeholders ;
- crédits, divulgations et liens de boutique clairement identifiés ;
- contenus reliés simples : premières impressions/review finale et autres publications du même jeu.

### Auteur `/auteurs/:slug`

- pseudo public, nom complet, bio, avatar, rôle éditorial et liens sociaux facultatifs ;
- liste chronologique de ses publications.

### Recherche `/recherche`

- recherche par titre de publication, titre de jeu ou nom/pseudo d'auteur ;
- filtres type, plateforme, genre et auteur ;
- ordre du plus récent au plus ancien ;
- pagination stable ;
- aucune recherche dans le corps Markdown en V1.

### Pages de jeu

Le modèle de données les permet, mais leur interface dédiée est différée. En V1, le jeu apparaît sur les publications et dans la recherche.

### Pages de confiance

- `/mentions-legales` ;
- `/confidentialite` ;
- `/rss.xml` ;
- `/sitemap.xml` et `robots.txt`.

## Administration

L'admin reste fonctionnel et sobre : tableaux, formulaires, éditeur Markdown, aperçu et actions de statut. Les composants shadcn/ui classiques suffisent.

Fonctions V1 :

- tableau de bord avec brouillons récents et dernières publications ;
- liste et édition des publications selon les droits ;
- éditeur Markdown en deux modes, édition et aperçu ;
- upload d'images, insertion dans le corps et choix de couverture ;
- gestion des jeux et de leurs métadonnées ;
- gestion des auteurs et taxonomies réservée à l'admin ;
- messages d'erreur explicites et prévention de la perte de modifications non enregistrées.

## Confidentialité

- aucun formulaire, compte ou profil public de lecteur ;
- Cloudflare Web Analytics uniquement en V1 ;
- aucun cookie de mesure d'audience ou stockage local analytique ;
- la préférence de thème peut être stockée localement et est documentée ;
- aucun iframe tiers n'est chargé avant un clic volontaire sur le placeholder concerné ;
- ce clic ne vaut que pour l'embed choisi et n'est pas conservé comme consentement global.

La page de confidentialité doit décrire les données techniques réellement traitées par Cloudflare et les fournisseurs externes. Les mentions légales définitives nécessitent l'identité et les coordonnées fournies par l'éditeur avant la mise en production.

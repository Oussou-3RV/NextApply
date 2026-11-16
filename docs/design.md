# NextApply — Direction visuelle

Les maquettes de référence sont dans docs/design/. Les respecter fidèlement.

## Couleurs (variables CSS dans src/styles/tokens.css)
- --bleu #0F2A7A : texte, boutons, titres
- --bleu-secondaire #4A5C84 : texte secondaire
- --bleu-pale #EDF1FA : surfaces, survol des lignes
- --bleu-ligne #DCE3F2 : filets de séparation
- --bleu-clair #C9D6F5 : texte secondaire sur fond bleu
- --rouge #C8102E : un seul accent (statut « Nouvelle », focus clavier)
- --rouge-clair #FF5A68 : le rouge, mais seulement sur fond bleu
- --blanc #FFFFFF : fond
Le rouge reste rare : s'il est partout, il ne signale plus rien.

## Typographie
- Une seule police : Public Sans (libre, licence OFL), installée par npm
  (@fontsource-variable/public-sans), sans appel à Google Fonts. Marianne n'est pas
  utilisée : sa licence la réserve aux sites de l'administration française.
- Titre de page : 52 px, graisse 800, interlettrage -0.04em, interligne 1.
- Titre d'offre : 60 px (page de fiche). Titres de section : 26 px. Titres de liste : 19 px, graisse 700.
- Texte : 16 à 17 px. Texte courant aligné à gauche, lignes de moins de 80 caractères.
- Chiffres tabulaires pour les scores.

## Logo
- Symbole : public/nextapply-symbole.svg (loupe bleue, coche rouge).
- Nom : « Next » en bleu et « Apply » en rouge, graisse 800, interlettrage -0.04em.
  Écrit en HTML avec la police, jamais en image.

## Composants
- Boutons : coins droits (radius 0), hauteur min 52 px. Plein bleu (texte blanc)
  ou contour bleu de 2 px.
- Champs : seulement un trait dessous (2 px bleu), pas de boîte.
- Listes : lignes aérées avec un filet de 1 px, fond bleu pâle au survol. Pas de cartes.
- Focus clavier : contour rouge de 3 px, décalé de 3 px.
- Onglets : texte, trait de 3 px sous l'onglet actif.
- Icônes : Lucide (lucide-react), au trait, de la couleur du texte. Une icône seule
  remplace le texte seulement pour une action connue (modifier, supprimer, se déconnecter),
  avec aria-label et title. Ailleurs, l'icône accompagne le texte (Ajouter, messages d'erreur).
- Conteneur : largeur max 1152 px, marges clamp(20px, 5vw, 64px).

## Statuts (la forme dit le statut, pas la couleur seule)
- Nouvelle : point rouge plein. Vue : cercle bleu vide.
- Postulée : point bleu plein, avec la date. Masquée : texte barré.

## Le seul effet de l'app
Sur la fiche de candidature, cliquer une ligne copie sa valeur : la ligne s'inverse
(fond bleu, texte blanc) avec « Copié » pendant environ 1,4 seconde. Aucune autre
animation.

## À ne pas faire
- Cartes arrondies avec ombres, dégradés, effets de verre.
- Étiquettes en majuscules espacées au-dessus des titres.
- Un seul mot d'un titre mis en couleur (le logo est la seule exception).
- Flèche « → » sur les boutons, animations d'apparition, emojis.
- Bibliothèque de composants (Material, shadcn, etc.) : CSS simple avec les variables.

## Textes
Phrases courtes, verbes simples, sentence case. Un bouton dit ce qu'il fait
(« Marquer comme postulée »). Une erreur explique quoi faire.

## Accessibilité
Vrais <button> et <a>, <label> sur chaque champ, contraste suffisant,
utilisable au clavier.
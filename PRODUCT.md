# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Deux surfaces web : l'app React (frontend/, http://localhost:5173) et la popup de
l'extension Chrome Manifest V3 (extension/, sans React). Pas d'application mobile.

## Users

- **Utilisateur principal : moi.** Étudiant en informatique, je cherche un stage ou
  un premier emploi. J'utilise NextApply pendant ma vraie recherche, souvent entre
  mes cours, avec peu de temps : je navigue sur les sites d'emploi, je trie les
  offres, je remplis les candidatures, puis je relance.
- **D'autres étudiants, plus tard.** Le partage devient possible (confirmé lors de
  l'init du 2026-11-22). Ce n'est pas encore une décision de produit : docs/vision.md
  garde les comptes multiples et le déploiement public hors de la version 1. Les
  textes et le premier lancement ne doivent pas supposer un utilisateur unique qui
  connaît déjà tout.

## Product Purpose

Rendre la recherche d'emploi moins épuisante. Quand je trouve une offre, NextApply
me dit si je l'ai déjà vue ou envoyée, et si elle demande trop d'expérience pour
moi. Il remplit les formulaires à partir de mon profil et prépare ma lettre.

Ça marche quand :
- je l'utilise pour de vraies candidatures ;
- remplir une candidature prend quelques minutes au lieu de plusieurs (à mesurer) ;
- je ne postule plus deux fois à la même offre.

## Positioning

Un assistant qui travaille dans mon propre navigateur, seulement à ma demande. Il
n'y a pas de collecte d'offres par un serveur et pas d'envoi automatique : c'est
toujours moi qui relis, valide et clique sur « Envoyer ». Le score et la lettre
s'appuient sur mon profil structuré, rempli à partir de mon CV.

## Operating Context

- Sites d'emploi à prendre en charge en premier : **LinkedIn**, **Indeed** et la
  **plateforme de stages de l'université** (et les portails carrière où elle
  renvoie). Les autres viendront seulement si le besoin se confirme.
- Les offres arrivent **en français et en anglais**. L'extraction par l'IA, le
  score, la détection des doublons et la lettre doivent gérer les deux langues.
  L'interface de NextApply reste en français.
- Parcours : ajouter une offre depuis la page (extension), la voir dans la liste
  Offres, ouvrir sa fiche (score expliqué, lettre, lignes à copier), la marquer
  comme postulée, relancer après 7 jours sans nouvelles (page Aperçu).
- Usage sur un ordinateur portable, dans Chrome, en local (backend sur
  http://localhost:8080).

## Capabilities and Constraints

- Fait : profil structuré (identité, scolarité, expériences, compétences), import
  du CV en PDF avec proposition de profil par l'IA et écran de relecture, extension
  (remplissage des champs vides reconnus, bloc « Cette offre »), offres avec
  statuts et doublons, score expliqué (70 % compétences, 30 % expérience), lettre
  à relire, page Aperçu (en cours sur la branche feat/tableau-de-bord).
- Statuts d'une offre : Nouvelle, Vue, Postulée (avec la date), Masquée.
- Termes du produit : « offre », « postulée », « relancer », « profil », « fiche
  d'une offre », « Aperçu », « Cette offre », « Remplir cette page ».
- Contraintes : les données personnelles restent dans mon environnement, sauf les
  appels à l'IA, qui n'envoient que le nécessaire. Aucun secret dans le dépôt.
- Hors périmètre de la version 1 : soumission automatique, scraping par serveur,
  comptes multiples, abonnements et paiement, application mobile, déploiement
  public.
- Décisions ouvertes : quand et comment ouvrir NextApply à d'autres étudiants
  (comptes, hébergement, coûts de l'IA, premier lancement).

## Brand Commitments

- Nom : NextApply. Logo dans frontend/public/nextapply-symbole.svg (loupe bleue,
  coche rouge) et docs/design/Logo.png ; le nom s'écrit en HTML, jamais en image.
- Ton : phrases courtes, verbes simples, sentence case. Un bouton dit ce qu'il fait
  (« Marquer comme postulée »). Une erreur explique quoi faire. Pas d'emojis.
- La direction visuelle, déjà établie, est dans docs/design.md avec les maquettes
  de docs/design/. Elle fait autorité pour toute décision visuelle.

## Evidence on Hand

- Maquettes : docs/design/Connexion.png, Offres.png, Fiche d'une offre.png,
  Logo.png.
- Documents produit : docs/vision.md, docs/roadmap.md, docs/decisions.md.
- Pas de témoignages, pas d'utilisateurs externes, pas de mesures de temps
  gagné pour l'instant : ne pas en inventer.

## Product Principles

1. **L'humain valide toujours.** NextApply prépare, je décide et j'envoie.
2. **À ma demande, dans mon navigateur.** Aucune action en arrière-plan sur les
   sites d'emploi.
3. **Dire tout de suite ce qui compte.** Déjà vue, déjà postulée, trop
   d'expérience exigée : l'info arrive avant que je perde du temps.
4. **Mes données restent chez moi.** On n'envoie à l'IA que le nécessaire.
5. **Rien d'inutile pour la version 1.** Chaque fonction sert une vraie
   candidature.

## Accessibility & Inclusion

Vrais `<button>` et `<a>`, un `<label>` sur chaque champ, contraste suffisant,
tout utilisable au clavier (focus visible). La forme dit le statut, pas la
couleur seule.

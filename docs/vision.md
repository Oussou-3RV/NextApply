# NextApply — Vision

## Le problème
Chercher un premier emploi ou un stage en informatique est épuisant :
- Les formulaires de candidature sont longs et répétitifs (identité,
  scolarité, expériences) alors que tout est déjà dans mon CV.
- Je ne sais pas toujours si j'ai déjà postulé à une offre, surtout
  quand elle apparaît sur plusieurs sites.
- Beaucoup d'offres exigent plus d'années d'expérience que je n'en ai,
  et je perds du temps à les ouvrir pour m'en rendre compte.

## Pour qui
Pour moi, d'abord : NextApply est un outil personnel que j'utilise dans
ma vraie recherche d'emploi. Le partager avec d'autres n'est pas un
objectif. Si ça arrive un jour, ce sera une nouvelle décision.

## La promesse
Quand je trouve une offre, NextApply me dit si je l'ai déjà vue ou
envoyée, si elle exige trop d'expérience pour moi, et il remplit les
formulaires à partir de mon profil. Il prépare aussi ma lettre. C'est
toujours moi qui relis, valide et clique sur « Envoyer ».

## Comment ça marche
Je navigue normalement sur les sites d'emploi. Une extension Chrome
travaille dans mon navigateur, à ma demande :
- « Ajouter à NextApply » envoie le texte de l'offre à mon backend ;
- l'extension remplit les formulaires à partir de mon profil ;
- elle affiche si l'offre est déjà connue ou postulée.
Il n'y a pas de collecte automatique par un serveur.

## Version 1 (inclus)
- Profil structuré (identité, scolarité, expériences, compétences)
- Import du CV avec pré-remplissage du profil et relecture
- Extension Chrome : remplissage des formulaires
- Ajout d'une offre depuis la page, détection des doublons
- Statut par offre (vue, postulée) et historique
- Extraction des années d'expérience exigées et avertissement
- Score de compatibilité avec explication
- Lettre de motivation à relire
- Tableau de bord simple

## Hors périmètre
- Soumission automatique des candidatures
- Collecte automatique d'offres par un serveur (scraping)
- Comptes multiples, abonnements, paiement
- Application mobile
- Déploiement public (en local d'abord)

## Principes
- L'humain valide toujours avant l'envoi.
- Les actions sont déclenchées par moi, dans mon navigateur.
- Mes données personnelles ne quittent pas mon environnement,
  sauf les appels à l'IA, qui n'envoient que le nécessaire.
- Les secrets ne sont jamais dans le dépôt Git.

## Comment je saurai que ça marche
- Je l'utilise pour de vraies candidatures.
- Remplir les informations d'une candidature prend quelques minutes
  au lieu de plusieurs [à mesurer].
- Je ne postule plus deux fois à la même offre.

## Risques
- Les formulaires des sites varient : le remplissage ne marchera pas
  partout (commencer par quelques sites que j'utilise vraiment)
- Extraction du CV imparfaite (d'où la relecture)
- Lettres trop génériques
- Temps disponible pendant mes cours
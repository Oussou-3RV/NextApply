# Extension Chrome NextApply

Remplit les formulaires de candidature à partir de mon profil NextApply.
Elle remplit seulement les champs vides qu'elle reconnaît et les encadre en bleu.
C'est toujours moi qui relis et qui clique sur « Envoyer ».

## Installer (en local)

1. Le backend tourne (http://localhost:8080) et `frontend/.env.local` existe :
   l'extension lit les mêmes variables Supabase que l'app.
2. Construire l'extension :
   ```bash
   cd extension
   npm install
   npm run build
   ```
3. Dans Chrome, ouvrir `chrome://extensions`, activer le **Mode développeur**,
   cliquer **Charger l'extension non empaquetée** et choisir `extension/dist`.
4. Épingler NextApply dans la barre d'outils, puis se connecter avec le compte de l'app.

Après une modification : `npm run build`, puis le bouton « Recharger » de l'extension
dans `chrome://extensions`.

## Comment ça marche

- `src/popup/` : la fenêtre de l'extension. Connexion Supabase (session gardée dans
  `chrome.storage.local`), lecture du profil par `GET /api/profile`.
- `src/content/` : le script injecté dans la page, seulement au clic sur
  « Remplir cette page ». Il reçoit les valeurs du profil, jamais le jeton.
  `match.ts` reconnaît les champs (autocomplete, name, id, libellé…).
- `public/manifest.json` : permissions. `activeTab` donne accès à l'onglet seulement
  au clic ; les sites d'emploi visés sont listés pour pouvoir remplir leurs iframes.
  La clé `key` fixe l'identifiant de l'extension, autorisé dans le CORS du backend.

## Un champ n'est pas reconnu ?

Copier son HTML (clic droit, Inspecter), ajouter un cas dans
`src/content/fill.test.ts`, corriger les règles de `src/content/match.ts`,
puis `npm test`.

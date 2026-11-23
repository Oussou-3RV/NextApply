# NextApply

Un assistant personnel pour chercher un stage ou un premier emploi en informatique.

Quand je trouve une offre, NextApply me dit si je l'ai déjà vue ou envoyée, et si
elle demande plus d'expérience que je n'en ai. Il remplit les formulaires de
candidature à partir de mon profil et prépare ma lettre. C'est toujours moi qui
relis, valide et clique sur « Envoyer ».

Tout se passe dans mon navigateur, à ma demande : pas de collecte d'offres par un
serveur, pas d'envoi automatique. Le projet tourne en local.

## Ce que fait la version 1

- **Profil structuré** : identité, scolarité, expériences, compétences. Il peut
  être pré-rempli à partir d'un CV en PDF (proposition de l'IA, puis relecture).
- **Extension Chrome** : « Ajouter à NextApply » enregistre l'offre de la page ;
  le bloc « Cette offre » dit si elle est déjà connue, postulée ou publiée sur un
  autre site ; « Remplir cette page » remplit les champs vides qu'elle reconnaît.
- **Offres** : statuts (Nouvelle, Vue, Postulée, Masquée), années d'expérience
  exigées et avertissement.
- **Fiche d'une offre** : score de compatibilité expliqué (70 % compétences,
  30 % expérience), lettre de motivation à relire, lignes à copier.
- **Aperçu** : candidatures de la semaine, offres à relancer après 7 jours sans
  nouvelles, meilleures offres pour commencer, profil à compléter.

## Structure

| Dossier | Contenu |
|---|---|
| `backend/` | API Java 21, Spring Boot 4, Spring Data JPA, Flyway, JWT Supabase |
| `frontend/` | App React + Vite + TypeScript |
| `extension/` | Extension Chrome Manifest V3, TypeScript + Vite |
| `docs/` | Vision, feuille de route, décisions, direction visuelle et maquettes |

Données et authentification : Supabase (PostgreSQL, Auth). Analyse du CV et des
offres, lettre : OpenAI, appelé seulement par le backend.

## Lancer le projet en local

Prérequis : Java 21, Node.js, un projet Supabase et, pour les fonctions d'IA,
une clé OpenAI.

### 1. Backend (http://localhost:8080)

Variables d'environnement :

| Variable | Rôle |
|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Base PostgreSQL de Supabase (Session pooler) |
| `SUPABASE_URL` | Validation des jetons de connexion |
| `OPENAI_API_KEY` | Optionnelle : sans elle, les fonctions d'IA répondent une erreur claire (503) |
| `CORS_ALLOWED_ORIGINS` | Optionnelle : origines autorisées, séparées par des virgules |

```bash
cd backend
./mvnw spring-boot:run
```

Flyway applique les migrations au démarrage. Pour vérifier que l'API répond :
http://localhost:8080/actuator/health

### 2. Frontend (http://localhost:5173)

Copier `frontend/.env.example` en `frontend/.env.local` et le remplir :

| Variable | Rôle |
|---|---|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique du projet (jamais la clé `service_role`) |
| `VITE_API_URL` | Optionnelle : adresse du backend (par défaut http://localhost:8080) |

```bash
cd frontend
npm install
npm run dev
```

### 3. Extension Chrome

```bash
cd extension
npm install
npm run build
```

Dans Chrome : `chrome://extensions`, activer le mode développeur, puis
« Charger l'extension non empaquetée » et choisir `extension/dist`. Détails dans
[extension/README.md](extension/README.md).

## Tests

```bash
cd backend && ./mvnw test
```

```bash
cd frontend && npm test
```

```bash
cd extension && npm test
```

## Documentation

- [docs/vision.md](docs/vision.md) : le problème, la promesse, le périmètre
- [docs/roadmap.md](docs/roadmap.md) : les étapes et leur avancement
- [docs/decisions.md](docs/decisions.md) : les choix importants et leurs raisons
- [docs/design.md](docs/design.md) : la direction visuelle (maquettes dans `docs/design/`)
- [PRODUCT.md](PRODUCT.md) : le contexte produit lu par le skill de design Impeccable

## Sécurité

Aucun secret dans le dépôt : les identifiants passent par des variables
d'environnement ou des fichiers ignorés par Git (`.env.local`,
`application-local.properties`). Chaque donnée est filtrée par l'utilisateur
connecté, d'après son jeton.

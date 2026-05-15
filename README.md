# CRM Professional

Plateforme CRM full-stack (FastAPI + React) pour piloter les clients, projets et documents commerciaux (devis, factures, contrats, cahier de charge), avec des capacités IA intégrées (prédiction, recommandation, génération assistée).

## 1. Vue d'ensemble

## 1.1 Objectif produit
CRM Professional vise à unifier les opérations commerciales et de delivery dans une seule application:
- gestion du cycle client (prospection -> exécution -> facturation -> contractualisation),
- suivi opérationnel des projets,
- automatisation assistée par IA pour accélérer la décision.

## 1.2 Parties prenantes
- Direction / Manager: vision synthétique, suivi des KPI, alertes et arbitrage de charge.
- Équipe opérationnelle (Admin, Developer): exécution quotidienne (clients, projets, docs).
- Client final: accès à un portail dédié pour consulter ses données et documents.

## 1.3 Valeur métier
- réduction du temps administratif via des formulaires unifiés et exports,
- amélioration de la qualité décisionnelle via l’IA (résumés, scoring, recommandations),
- meilleure traçabilité (historique d’actions, statuts, signatures, pièces jointes).

## 2. Fonctionnalités

## 2.1 Gestion métier
- Clients: création, mise à jour, suivi statut, devise, informations fiscales.
- Projets: équipe, notes, fichiers, jalons, rappels, scoring.
- Devis: création, lignes d’articles, statut, conversion potentielle.
- Factures: génération et suivi.
- Contrats: édition, signatures client/prestataire, export PDF.
- Cahier de charge: rédaction structurée, versioning, export.

## 2.2 Espace client
- Authentification client séparée (`/client-auth`),
- Portail client (`/client-portal/*`) pour la consultation ciblée.

## 2.3 IA intégrée
- Chat prédictif (Groq) basé sur les données CRM.
- Résumé automatique des notes projet (`/projets/{id}/notes/summary`).
- Auto scoring IA clients (`/clients/ai-scoring/recompute`).
- Recommandations de réallocation de ressources (AI Monitoring).
- Génération assistée:
  - devis (`POST /ai-generation/devis`),
  - cahier de charge (`POST /ai-generation/cahier`).

## 3. Architecture technique

```text
[Frontend React/Vite/TS] --HTTP JSON--> [FastAPI /api/v1] --ORM--> [PostgreSQL]
                                                |
                                             [Alembic]
                                                |
                                           [Migrations]
```

## 3.1 Frontend
- Framework: React + TypeScript + Vite.
- Data fetching: Axios + TanStack Query.
- State global: Zustand (auth, thème, UI state).
- Routing: React Router.
- UI: composants custom + librairies utilitaires.

## 3.2 Backend
- API: FastAPI.
- ORM: SQLAlchemy 2.x.
- Migrations: Alembic.
- DB: PostgreSQL.
- Services IA: appels HTTP vers Groq via `requests`.
- Jobs / automatisations: APScheduler (selon modules activés).

## 4. Structure du repository

```text
crm-professional/
  backend/
    app/
      api/v1/endpoints/      # Endpoints REST
      core/config.py         # Configuration centralisée
      db/                    # Session, Base, registry
      models/                # Entités SQLAlchemy
      schemas/               # Contrats Pydantic
      services/              # Logique métier/IA
    alembic/                 # Migrations DB
    scripts/bootstrap_db.py  # Initialisation DB locale
    requirements.txt
    .env.example
  frontend/
    src/
      app/App.tsx            # Routing principal
      pages/                 # Écrans métier
      services/api.ts        # Couche d’accès API
      store/                 # Zustand stores
      components/            # UI + métier
    package.json
    .env.example
  README.md
```

## 5. Pré-requis
- Python 3.11+
- PostgreSQL 14+
- Node.js 18+
- npm 9+

## 6. Installation locale

## 6.1 Backend
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python scripts\bootstrap_db.py
alembic upgrade head
uvicorn app.main:app --reload
```

API docs:
- Swagger: `http://localhost:8000/docs`
- OpenAPI: `http://localhost:8000/openapi.json`

## 6.2 Frontend
```powershell
cd frontend
npm install
npm run dev
```

Application:
- `http://localhost:5173`

## 7. Configuration environnement

## 7.1 Backend (`backend/.env`)
Créer le fichier à partir de `backend/.env.example`.

Variables critiques:
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_DB`
- `GROQ_API_KEY`
- `GROQ_MODEL` (ex: `llama-3.1-8b-instant`)
- `CORS_ORIGINS`
- Variables Cloudinary si upload cloud activé.

## 7.2 Frontend (`frontend/.env`)
Créer le fichier à partir de `frontend/.env.example`.

Exemple:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## 8. Modules API (niveau fonctionnel)
Base URL: `/api/v1`

- `/auth`: login/register staff + profil.
- `/client-auth`: login/signup client.
- `/client-portal`: endpoints du portail client.
- `/clients`: gestion clients.
- `/projets`: gestion projets + sous-modules (team/notes/files/milestones).
- `/devis`, `/factures`, `/contrats`: documents commerciaux.
- `/cahier-de-charge`: spécifications projet.
- `/predictions`: endpoints IA prédictive.
- `/ai-monitoring`: optimisation allocation ressources.
- `/ai-generation`: génération assistée de contenu.

## 9. Flux métiers principaux

## 9.1 Authentification staff
1. Front appelle `POST /auth/login`.
2. Backend valide utilisateur.
3. Token stocké côté frontend (`localStorage`) et injecté dans `Authorization`.

## 9.2 Gestion projet collaborative
1. Création projet.
2. Ajout équipe projet.
3. Alimentation notes/fichiers/jalons/rappels.
4. IA peut résumer les notes et produire des recommandations.

## 9.3 Cycle documentaire
1. Générer/éditer devis.
2. Conversion / continuité vers facturation.
3. Contrat + signature.
4. Export PDF pour archivage / partage.

## 10. Data model (simplifié)
Entités centrales:
- `clients`
- `projets`
- `utilisateurs`
- `devis`
- `factures`
- `contrats`
- `cahier_de_charge`
- `rappels`
- `ml_predictions` / tables de monitoring selon modules

Relations clés:
- 1 client -> N projets/devis/factures/contrats.
- N utilisateurs <-> N projets (affectation équipe).
- Projet -> notes/fichiers/jalons.

## 11. IA: détails d’implémentation
- Provider actuel: Groq.
- Les endpoints IA utilisent `GROQ_API_KEY` + `GROQ_MODEL`.
- Des mécanismes de tolérance existent pour réponses IA non strictement JSON (parse + tentative de réparation).

## 12. Sécurité
- Ne jamais versionner de secrets (`.env`, clés API, credentials DB).
- Rotation immédiate des clés exposées.
- Contrôler les rôles/permissions avant release.
- Vérifier les routes client vs staff (isolation des accès).

## 13. Qualité & tests (pratique actuelle)
Le projet est majoritairement validé par tests manuels ciblés.

Checklist recommandée avant livraison:
- backend démarre + docs OpenAPI accessibles,
- frontend démarre + login fonctionne,
- CRUD client/projet/devis/facture/contrat,
- signature contrat client/prestataire,
- fonctionnalités IA critiques (génération, résumé, monitoring).

## 14. Dette technique connue
- Incohérences de typage TypeScript sur certains écrans hors scope immédiat.
- Restes d’encodage historique sur certaines chaînes FR.
- Hétérogénéité partielle entre familles de composants UI.

## 15. Troubleshooting

## 15.1 `500` sur `PUT /contrats/{id}`
Cause fréquente: payload d’update non partiel.
Action: vérifier que le frontend envoie uniquement les champs à modifier.

## 15.2 `502 Reponse IA invalide (JSON attendu)`
- vérifier `GROQ_API_KEY`,
- vérifier la connectivité sortante,
- vérifier `GROQ_MODEL`.

## 15.3 `401` côté frontend
- token expiré/invalide,
- `VITE_API_URL` incorrect,
- CORS backend mal configuré.

## 15.4 Migrations incohérentes
```powershell
cd backend
alembic current
alembic history
alembic upgrade head
```

## 16. Guide d’onboarding

## 16.1 Manager (30-45 min)
1. Lire sections 1, 2, 9.
2. Parcourir les modules dans l’application.
3. Valider la checklist qualité section 13.

## 16.2 Développeur (1-2 jours)
1. Setup local complet (sections 5-7).
2. Lire `backend/app/api/v1/api.py`, `frontend/src/services/api.ts`, `frontend/src/app/App.tsx`.
3. Exécuter un flux end-to-end réel.
4. Prendre un ticket de faible risque pour 1er commit.

## 17. Conventions de contribution
- Branches courtes par sujet.
- Commit messages explicites.
- Pas de secrets dans les commits.
- Si modèle DB modifié: migration Alembic obligatoire.
- Si endpoint modifié: mise à jour `frontend/src/services/api.ts` obligatoire.

## 18. Licence
Projet interne. Adapter la politique de licence selon les règles de l’organisation.

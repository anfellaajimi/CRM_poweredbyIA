## Guide d'onboarding
- Voir docs/ONBOARDING_INTERNE.md

# 🚀 CRM AI-Powered Professional - PostgreSQL

CRM professionnel avec intelligence artificielle et base de données PostgreSQL.

## 📋 Prérequis

- Python 3.8+
- PostgreSQL 12+
- Un navigateur web moderne

## 🔧 Installation

### 1. Installer PostgreSQL

#### Sur Windows:
1. Télécharger PostgreSQL depuis: https://www.postgresql.org/download/windows/
2. Installer avec le mot de passe: `postgres` (ou personnalisé)
3. Le service PostgreSQL démarre automatiquement

#### Sur Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Sur macOS:
```bash
brew install postgresql
brew services start postgresql
```

### 2. Créer la base de données

```bash
# Se connecter à PostgreSQL
sudo -u postgres psql

# Créer la base de données
CREATE DATABASE crm_db;

# Créer un utilisateur (optionnel)
CREATE USER crm_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE crm_db TO crm_user;

# Quitter
\q
```

### 3. Configurer le projet

1. **Modifier la configuration dans `app-postgresql.py`:**

```python
DB_CONFIG = {
    "host": "localhost",
    "database": "crm_db",
    "user": "postgres",        # Votre utilisateur PostgreSQL
    "password": "postgres",    # Votre mot de passe PostgreSQL
    "port": 5432
}
```

2. **Installer les dépendances Python:**

```bash
pip install -r requirements.txt
```

## 🚀 Lancement

### 1. Démarrer le backend

```bash
python app-postgresql.py
```

Le backend va automatiquement:
- ✅ Se connecter à PostgreSQL
- ✅ Créer toutes les tables nécessaires
- ✅ Insérer les données de test
- ✅ Démarrer l'API sur http://localhost:8000

### 2. Ouvrir le frontend

Double-cliquez sur `CRM-PROFESSIONAL-FINAL.html` ou ouvrez-le dans votre navigateur.

### 3. Se connecter

```
Email: admin@crm.com
Mot de passe: admin123
```

## 🗄️ Structure de la base de données

Le système crée automatiquement 8 tables:

### Tables principales:
- **users** - Utilisateurs du système
- **clients** - Clients de l'entreprise
- **projets** - Projets en cours et terminés
- **services** - Services (hébergement, domaines, etc.)
- **rappels** - Rappels et notifications
- **monitoring** - Données de monitoring des services
- **alertes** - Alertes système
- **tokens** - Tokens d'authentification

### Schéma des relations:

```
users
  └─ tokens (authentification)

clients
  ├─ projets
  │   └─ services
  │       └─ monitoring
  └─ rappels

alertes (indépendant)
```

## 📊 Fonctionnalités

### ✅ Gestion complète
- 👥 **Clients**: CRUD complet
- 📁 **Projets**: Gestion avec détails élaborés
- 💼 **Services**: Suivi des services actifs
- 🔔 **Rappels**: Système de notifications
- 🤖 **Monitoring IA**: Surveillance en temps réel
- ⚠️ **Alertes**: Système d'alertes intelligent

### 🎨 Modal de détails de projet
Chaque projet affiche:
- 📋 Informations complètes (statut, responsable, priorité, budget)
- 📊 Barre de progression animée
- 💬 Commentaires avec auteur et date
- 📝 Notes importantes
- ⭐ Évaluation sur 5 étoiles
- 🎨 Design professionnel avec animations

## 🔍 Vérification PostgreSQL

### Vérifier que PostgreSQL fonctionne:

```bash
# Sur Linux/macOS
sudo systemctl status postgresql

# Ou
pg_isready
```

### Se connecter à la base de données:

```bash
psql -U postgres -d crm_db
```

### Commandes utiles PostgreSQL:

```sql
-- Lister toutes les tables
\dt

-- Voir les clients
SELECT * FROM clients;

-- Voir les projets
SELECT * FROM projets;

-- Compter les enregistrements
SELECT COUNT(*) FROM clients;

-- Quitter
\q
```

## 🐛 Résolution de problèmes

### Erreur de connexion PostgreSQL

**Problème:** `FATAL: password authentication failed`

**Solution:**
1. Vérifier le mot de passe dans `DB_CONFIG`
2. Réinitialiser le mot de passe PostgreSQL:

```bash
sudo -u postgres psql
ALTER USER postgres PASSWORD 'nouveau_mot_de_passe';
```

### Base de données n'existe pas

**Problème:** `database "crm_db" does not exist`

**Solution:**
```bash
sudo -u postgres psql
CREATE DATABASE crm_db;
```

### Port déjà utilisé

**Problème:** Port 8000 déjà utilisé

**Solution:** Modifier le port dans `app-postgresql.py`:
```python
uvicorn.run(..., port=8001, ...)
```

### PostgreSQL ne démarre pas

**Sur Ubuntu/Debian:**
```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Sur macOS:**
```bash
brew services start postgresql
```

## 📦 Dépendances

- **FastAPI**: Framework web moderne
- **Uvicorn**: Serveur ASGI
- **psycopg2-binary**: Driver PostgreSQL pour Python
- **python-multipart**: Pour les formulaires
- **pydantic**: Validation des données

## 🔒 Sécurité

⚠️ **Important pour la production:**

1. Changer le mot de passe admin dans la base de données
2. Utiliser des variables d'environnement pour les credentials
3. Activer SSL pour PostgreSQL
4. Hasher les mots de passe (bcrypt)
5. Utiliser JWT tokens avec expiration

## 📝 Scripts SQL utiles

### Reset complet de la base de données:

```sql
-- Se connecter à PostgreSQL
sudo -u postgres psql -d crm_db

-- Supprimer toutes les données
TRUNCATE TABLE rappels, monitoring, alertes, services, projets, clients, tokens, users CASCADE;

-- Redémarrer l'application pour réinsérer les données de test
```

### Backup de la base de données:

```bash
pg_dump -U postgres crm_db > backup_crm_db.sql
```

### Restaurer le backup:

```bash
psql -U postgres crm_db < backup_crm_db.sql
```

## 🎯 Prochaines étapes

- [ ] Ajouter l'authentification JWT
- [ ] Hasher les mots de passe avec bcrypt
- [ ] Ajouter la pagination pour les grandes listes
- [ ] Implémenter le search/filtre
- [ ] Ajouter les exports PDF/Excel
- [ ] Notifications en temps réel avec WebSockets

## 📞 Support

Pour toute question ou problème:
- Vérifier d'abord que PostgreSQL est bien démarré
- Vérifier les logs dans le terminal
- Consulter la documentation PostgreSQL: https://www.postgresql.org/docs/

## 📄 Licence

MIT License - Libre d'utilisation

---

Fait avec ❤️ et Python + PostgreSQL



# Backend (FastAPI + SQLAlchemy + Alembic)

## Required files outside `app/`

- `alembic/`
- `alembic.ini`
- `.env`
- `requirements.txt`
- `scripts/bootstrap_db.py`

## Setup

```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
python scripts\bootstrap_db.py
alembic upgrade head
uvicorn app.main:app --reload
```

If `.env` password is wrong, both bootstrap and Alembic will prompt for password.

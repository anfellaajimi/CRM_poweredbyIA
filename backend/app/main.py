from datetime import datetime, timedelta
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router
from app.core.config import settings
from app.db import base  # noqa: F401
from app.db.base_class import Base
from app.db.session import SessionLocal, engine

try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.cron import CronTrigger
except Exception:  # pragma: no cover
    BackgroundScheduler = None  # type: ignore
    CronTrigger = None  # type: ignore

from app.services.reminders import generate_project_rappels, send_due_reminder_emails

openapi_tags = [
    {"name": "Health", "description": "Health and readiness endpoints."},
    {"name": "Auth", "description": "Authentication endpoints."},
    {"name": "Clients", "description": "Client management endpoints."},
    {"name": "Projets", "description": "Project management endpoints."},
    {"name": "Ressources", "description": "Project resource endpoints."},
    {"name": "Utilisateurs", "description": "Internal users endpoints."},
    {"name": "Services", "description": "Service lifecycle endpoints."},
    {"name": "Acces", "description": "Credentials and access endpoints."},
    {"name": "Rappels", "description": "Reminder endpoints."},
    {"name": "AI Monitoring", "description": "Monitoring endpoints for services."},
    {"name": "Devis", "description": "Quote and estimate endpoints."},
    {"name": "Factures", "description": "Invoice endpoints."},
    {"name": "Contrats", "description": "Contract endpoints."},
    {"name": "CahierDeCharge", "description": "Project requirements document endpoints."},
    {"name": "Dashboard", "description": "Dashboard aggregation endpoints."},
]

app = FastAPI(title=settings.APP_NAME, openapi_tags=openapi_tags)
UPLOADS_ROOT = Path(__file__).resolve().parents[1] / "uploads"
UPLOADS_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_ROOT)), name="uploads")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

_scheduler = None
_scheduler_started = False


@app.on_event("startup")
def startup_create_tables() -> None:
    Base.metadata.create_all(bind=engine)

    global _scheduler, _scheduler_started
    if _scheduler_started:
        return
    if not settings.ENABLE_REMINDER_SCHEDULER:
        _scheduler_started = True
        return
    if BackgroundScheduler is None or CronTrigger is None:
        # APScheduler not installed; keep API usable.
        _scheduler_started = True
        return

    scheduler = BackgroundScheduler()

    def daily_job() -> None:
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            generate_project_rappels(db, now=now)
            send_due_reminder_emails(db, now=now)
        finally:
            db.close()

    # Run every day at 08:00 server time.
    scheduler.add_job(daily_job, CronTrigger(hour=8, minute=0))
    # Also run once shortly after startup to populate reminders quickly.
    scheduler.add_job(daily_job, "date", run_date=datetime.utcnow() + timedelta(seconds=10))

    scheduler.start()
    _scheduler = scheduler
    _scheduler_started = True


@app.on_event("shutdown")
def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        try:
            _scheduler.shutdown(wait=False)
        except Exception:
            pass


@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.APP_NAME,
        "docs": "/docs",
    }

# Triggering reload
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
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
from app.services.ai_agent import run_ai_agent
from app.services.service_monitoring import run_service_monitoring_checks
from app.services.health_monitoring import run_health_checks
from app.services.ml_service import MLService

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
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)
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
    # Base.metadata.create_all(bind=engine)  # Removed: using Alembic migrations instead


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

    scheduler = BackgroundScheduler(
        job_defaults={
            "coalesce": True,
            "max_instances": 1,
            "misfire_grace_time": 3600,
        }
    )

    def daily_job() -> None:
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            generate_project_rappels(db, now=now)
            send_due_reminder_emails(db, now=now)
        finally:
            db.close()

    def ai_agent_job() -> None:
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            run_service_monitoring_checks(db, now=now)
            run_ai_agent(db, now=now)
        finally:
            db.close()

    # Run every day at 08:00 server time.
    scheduler.add_job(
        daily_job,
        CronTrigger(hour=8, minute=0),
        id="daily_job",
        replace_existing=True,
    )
    def health_monitoring_job() -> None:
        db = SessionLocal()
        try:
            run_health_checks(db)
        finally:
            db.close()

    def ml_predictions_job() -> None:
        db = SessionLocal()
        try:
            MLService.run_all_predictions(db)
        finally:
            db.close()

    # Run every 30 seconds.
    scheduler.add_job(
        health_monitoring_job,
        "interval",
        seconds=30,
        id="health_monitoring_job",
        replace_existing=True,
    )

    minute_interval = max(1, int(settings.AI_AGENT_CRON_MINUTE_INTERVAL or 15))
    scheduler.add_job(
        ai_agent_job,
        CronTrigger(minute=f"*/{minute_interval}"),
        id="ai_agent_job",
        replace_existing=True,
    )

    # ML Predictions every 24h at 02:00
    scheduler.add_job(
        ml_predictions_job,
        CronTrigger(hour=2, minute=0),
        id="ml_predictions_job",
        replace_existing=True,
    )

    scheduler.start()
    _scheduler = scheduler
    _scheduler_started = True

    # Run once at startup directly (avoids one-shot date-job misfire/remove races on reload).
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        
        try:
            generate_project_rappels(db, now=now)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error in generate_project_rappels: {e}")
            
        try:
            send_due_reminder_emails(db, now=now)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error in send_due_reminder_emails: {e}")
            
        try:
            run_service_monitoring_checks(db, now=now)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error in run_service_monitoring_checks: {e}")
            
        try:
            run_ai_agent(db, now=now)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error in run_ai_agent: {e}")
            
        try:
            run_health_checks(db)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error in run_health_checks: {e}")
            
        try:
            MLService.run_all_predictions(db)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error in MLService.run_all_predictions: {e}")
            
    finally:
        db.close()


@app.on_event("shutdown")
def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        try:
            _scheduler.shutdown(wait=False)
        except Exception:
            pass


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "timestamp": datetime.utcnow()}

@app.get("/", tags=["Health"])
def root():
    return {
        "name": settings.APP_NAME,
        "docs": "/docs",
    }

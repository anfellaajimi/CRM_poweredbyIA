from __future__ import annotations
import time
from datetime import datetime, timedelta
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen
from sqlalchemy import text, func
from sqlalchemy.orm import Session
from app.models.service_check import ServiceCheck
from app.models.incident import Incident
from app.models.activity_event import ActivityEvent
from app.api.v1.endpoints._activity import log_activity
from app.services.email import send_email
from app.core.config import settings

def _check_http(url: str, timeout: float = 5.0, retries: int = 3) -> tuple[str, int | None, str | None]:
    for i in range(retries):
        start = time.perf_counter()
        try:
            req = Request(url, method="GET")
            with urlopen(req, timeout=timeout) as response:
                elapsed = int((time.perf_counter() - start) * 1000)
                code = response.getcode()
                if 200 <= code < 300:
                    return str(code), elapsed, None
                return str(code), elapsed, f"HTTP Error {code}"
        except HTTPError as e:
            elapsed = int((time.perf_counter() - start) * 1000)
            if i == retries - 1:
                return str(e.code), elapsed, str(e.reason)
        except (URLError, Exception) as e:
            if i == retries - 1:
                return "offline", None, str(e)
        time.sleep(1) # wait before retry
    return "offline", None, "Max retries reached"

def _check_database(db: Session) -> tuple[str, int | None, str | None]:
    start = time.perf_counter()
    try:
        db.execute(text("SELECT 1"))
        elapsed = int((time.perf_counter() - start) * 1000)
        return "200", elapsed, None
    except Exception as e:
        return "offline", None, str(e)

def _check_agent(db: Session) -> tuple[str, int | None, str | None]:
    # We check if the agent has logged anything in the last 15 minutes
    start = time.perf_counter()
    try:
        threshold = datetime.utcnow() - timedelta(minutes=15)
        last_event = db.query(ActivityEvent).filter(
            ActivityEvent.entityType == "ai_agent",
            ActivityEvent.createdAt >= threshold
        ).first()
        elapsed = int((time.perf_counter() - start) * 1000)
        if last_event:
            return "200", elapsed, None
        return "warning", elapsed, "No agent activity in the last 15 minutes"
    except Exception as e:
        return "offline", None, str(e)

def run_health_checks(db: Session):
    now = datetime.utcnow()
    checks = [
        ("Frontend", "http://localhost:5173"),
        ("Backend", "http://localhost:8000/health"),
    ]
    
    results = []
    
    # HTTP Checks
    for name, url in checks:
        status, resp_time, error = _check_http(url)
        results.append({
            "service_name": name,
            "status": status,
            "response_time_ms": resp_time,
            "error_message": error
        })
        
    # Database Check
    status, resp_time, error = _check_database(db)
    results.append({
        "service_name": "Database",
        "status": status,
        "response_time_ms": resp_time,
        "error_message": error
    })
    
    # Agent IA Check
    status, resp_time, error = _check_agent(db)
    results.append({
        "service_name": "Agent IA",
        "status": status,
        "response_time_ms": resp_time,
        "error_message": error
    })
    
    for res in results:
        # Save check
        check_row = ServiceCheck(
            service_name=res["service_name"],
            status=res["status"],
            response_time_ms=res["response_time_ms"],
            error_message=res["error_message"],
            checked_at=now
        )
        db.add(check_row)
        
        # Handle Incident
        is_down = res["status"] == "offline" or (res["status"].startswith("5"))
        
        # Check if there's an open incident
        open_incident = db.query(Incident).filter(
            Incident.service_name == res["service_name"],
            Incident.resolved_at == None
        ).first()
        
        if is_down:
            if not open_incident:
                # Create new incident
                new_incident = Incident(
                    service_name=res["service_name"],
                    started_at=now
                )
                db.add(new_incident)
                
                # Internal Notification
                log_activity(
                    db,
                    entity_type="system",
                    entity_id=None,
                    action="incident_started",
                    message=f"[MONITORING] Service {res['service_name']} est Offline!",
                    actor="System Monitor"
                )
                
                # Email Alert
                if settings.ADMIN_EMAIL:
                    send_email(
                        to_email=settings.ADMIN_EMAIL,
                        subject=f"[ALERTE MONITORING] Service {res['service_name']} est OFFLINE",
                        body=f"Le service {res['service_name']} a été détecté comme indisponible à {now.isoformat()}.\nErreur: {res['error_message']}"
                    )
                
                # Critical Alert for DB
                if res["service_name"] == "Database":
                     log_activity(
                        db,
                        entity_type="system",
                        entity_id=None,
                        action="critical",
                        message="[CRITIQUE] La base de données PostgreSQL est inaccessible!",
                        actor="System Monitor"
                    )
        else:
            if open_incident:
                # Resolve incident
                open_incident.resolved_at = now
                duration_sec = (now - open_incident.started_at).total_seconds()
                open_incident.duration_minutes = int(duration_sec / 60)
                
                log_activity(
                    db,
                    entity_type="system",
                    entity_id=None,
                    action="incident_resolved",
                    message=f"[MONITORING] Service {res['service_name']} est de nouveau en ligne après {int(duration_sec / 60)} min.",
                    actor="System Monitor"
                )

                if settings.ADMIN_EMAIL:
                    send_email(
                        to_email=settings.ADMIN_EMAIL,
                        subject=f"[RESOLU] Service {res['service_name']} est de nouveau en ligne",
                        body=f"Le service {res['service_name']} est revenu en ligne à {now.isoformat()} après une interruption de {int(duration_sec / 60)} minutes."
                    )
                
    db.commit()
    return results

def get_uptime_stats(db: Session, hours: int = 24) -> dict:
    threshold = datetime.utcnow() - timedelta(hours=hours)
    
    services = ["Frontend", "Backend", "Database", "Agent IA"]
    stats = {}
    
    for svc in services:
        total = db.query(ServiceCheck).filter(
            ServiceCheck.service_name == svc,
            ServiceCheck.checked_at >= threshold
        ).count()
        
        if total == 0:
            stats[svc] = 100.0
            continue
            
        healthy = db.query(ServiceCheck).filter(
            ServiceCheck.service_name == svc,
            ServiceCheck.checked_at >= threshold,
            ServiceCheck.status == "200"
        ).count()
        
        stats[svc] = round((healthy / total) * 100, 2)
        
    return stats

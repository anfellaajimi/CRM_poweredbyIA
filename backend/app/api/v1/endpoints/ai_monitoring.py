from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.activity_event import ActivityEvent
from app.models.monitoring import AIMonitoring
from app.models.rappel import Rappel
from app.models.service import Service
from app.schemas.monitoring import AIMonitoringCreate, AIMonitoringRead, AIMonitoringUpdate
from app.services.ai_agent import run_ai_agent
from app.services.service_monitoring import run_service_monitoring_checks

router = APIRouter(prefix="/ai-monitoring", tags=["AI Monitoring"])


@router.post("/agent/run")
def run_agent(db: Session = Depends(get_db)):
    checks = run_service_monitoring_checks(db)
    agent = run_ai_agent(db)
    return {"checks": checks, "agent": agent}


@router.get("/agent/activity")
def get_agent_activity(db: Session = Depends(get_db)):
    alerts = (
        db.query(Rappel)
        .filter(Rappel.systemKey.like("ai-agent:%"), Rappel.statut != "termine")
        .order_by(Rappel.createdAt.desc())
        .limit(30)
        .all()
    )
    actions = (
        db.query(ActivityEvent)
        .filter(ActivityEvent.entityType == "ai_agent")
        .order_by(ActivityEvent.createdAt.desc())
        .limit(30)
        .all()
    )
    warning_count = sum(1 for a in alerts if (a.priorite or "").lower() != "elevee")
    critical_count = sum(1 for a in alerts if (a.priorite or "").lower() == "elevee")
    return {
        "alerts": [
            {
                "id": a.id,
                "projectId": a.projetID,
                "title": a.titre,
                "message": a.message,
                "priority": a.priorite,
                "status": a.statut,
                "createdAt": a.createdAt,
            }
            for a in alerts
        ],
        "actions": [
            {
                "id": e.eventID,
                "action": e.action,
                "message": e.message,
                "entityId": e.entityID,
                "createdAt": e.createdAt,
            }
            for e in actions
        ],
        "summary": {
            "warning": warning_count,
            "critical": critical_count,
            "total": len(alerts),
        },
    }


@router.put("/agent/alerts/{alert_id}/resolve", status_code=status.HTTP_204_NO_CONTENT)
def resolve_agent_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = (
        db.query(Rappel)
        .filter(Rappel.id == alert_id, Rappel.systemKey.like("ai-agent:%"))
        .first()
    )
    if not alert:
        raise HTTPException(status_code=404, detail="AI agent alert not found")
    alert.statut = "termine"
    alert.resolvedAt = datetime.utcnow()
    db.commit()
    return None


@router.get("/agent/alerts/history")
def get_agent_alert_history(db: Session = Depends(get_db)):
    rows = (
        db.query(Rappel)
        .filter(Rappel.systemKey.like("ai-agent:%"), Rappel.statut == "termine")
        .order_by(Rappel.resolvedAt.desc().nullslast(), Rappel.createdAt.desc())
        .all()
    )
    return {
        "history": [
            {
                "id": a.id,
                "projectId": a.projetID,
                "title": a.titre,
                "message": a.message,
                "priority": a.priorite,
                "status": a.statut,
                "createdAt": a.createdAt,
                "resolvedAt": a.resolvedAt,
                "resolvedBy": "AI agent / utilisateur",
            }
            for a in rows
        ]
    }


@router.get("/diagnostics")
def get_monitoring_diagnostics(db: Session = Depends(get_db)):
    total_services = db.query(Service).count()
    services_with_url = (
        db.query(Service)
        .filter(Service.url.isnot(None), Service.url != "")
        .count()
    )
    monitoring_rows = db.query(AIMonitoring).count()
    monitored_service_ids = {
        int(x[0])
        for x in db.query(AIMonitoring.serviceID).all()
    }
    services_without_monitoring = max(0, total_services - len(monitored_service_ids))
    return {
        "totalServices": total_services,
        "servicesWithUrl": services_with_url,
        "monitoringRows": monitoring_rows,
        "servicesWithoutMonitoring": services_without_monitoring,
    }


@router.get("", response_model=list[AIMonitoringRead])
def list_monitoring(db: Session = Depends(get_db)):
    return db.query(AIMonitoring).order_by(AIMonitoring.monitoringID.desc()).all()


@router.get("/{monitoring_id}", response_model=AIMonitoringRead)
def get_monitoring(monitoring_id: int, db: Session = Depends(get_db)):
    item = db.get(AIMonitoring, monitoring_id)
    if not item:
        raise HTTPException(status_code=404, detail="Monitoring not found")
    return item


@router.post("", response_model=AIMonitoringRead, status_code=status.HTTP_201_CREATED)
def create_monitoring(payload: AIMonitoringCreate, db: Session = Depends(get_db)):
    data = payload.model_dump()
    if data.get("lastCheck") is None:
        data.pop("lastCheck", None)
    item = AIMonitoring(**data)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{monitoring_id}", response_model=AIMonitoringRead)
def update_monitoring(monitoring_id: int, payload: AIMonitoringUpdate, db: Session = Depends(get_db)):
    item = db.get(AIMonitoring, monitoring_id)
    if not item:
        raise HTTPException(status_code=404, detail="Monitoring not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{monitoring_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_monitoring(monitoring_id: int, db: Session = Depends(get_db)):
    item = db.get(AIMonitoring, monitoring_id)
    if not item:
        raise HTTPException(status_code=404, detail="Monitoring not found")
    db.delete(item)
    db.commit()
    return None

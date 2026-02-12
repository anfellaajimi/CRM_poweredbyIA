from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.monitoring import AIMonitoring
from app.schemas.monitoring import AIMonitoringCreate, AIMonitoringRead, AIMonitoringUpdate

router = APIRouter(prefix="/ai-monitoring", tags=["AI Monitoring"])


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

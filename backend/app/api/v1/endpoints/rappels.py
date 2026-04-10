from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
from app.db.session import get_db
from app.models.client import Client
from app.models.projet import Projet
from app.models.rappel import Rappel
from app.schemas.rappel import RappelCreate, RappelRead, RappelUpdate
from app.services.reminders import generate_project_rappels, send_due_reminder_emails

router = APIRouter(prefix="/rappels", tags=["Rappels"])


@router.get("", response_model=list[RappelRead])
def list_rappels(
    db: Session = Depends(get_db),
    projetID: int | None = Query(default=None),
    clientID: int | None = Query(default=None),
    statut: str | None = Query(default=None),
    source: str | None = Query(default=None),
):
    q = db.query(Rappel)
    if projetID is not None:
        q = q.filter(Rappel.projetID == projetID)
    if clientID is not None:
        q = q.filter(Rappel.clientID == clientID)
    if statut is not None:
        q = q.filter(Rappel.statut == statut)
    if source:
        s = source.lower().strip()
        if s == "system":
            q = q.filter(Rappel.systemKey.isnot(None))
        elif s == "manual":
            q = q.filter(Rappel.systemKey.is_(None))
    return q.order_by(Rappel.id.desc()).all()


@router.get("/{rappel_id}", response_model=RappelRead)
def get_rappel(rappel_id: int, db: Session = Depends(get_db)):
    item = db.get(Rappel, rappel_id)
    if not item:
        raise HTTPException(status_code=404, detail="Rappel not found")
    return item


@router.post("", response_model=RappelRead, status_code=status.HTTP_201_CREATED)
def create_rappel(payload: RappelCreate, db: Session = Depends(get_db)):
    client_id = payload.clientID
    if client_id is None:
        if payload.projetID is None:
            raise HTTPException(status_code=400, detail="clientID or projetID is required")
        projet = db.get(Projet, payload.projetID)
        if not projet:
            raise HTTPException(status_code=400, detail="Projet not found")
        client_id = projet.clientID
    else:
        if not db.get(Client, client_id):
            raise HTTPException(status_code=400, detail="Client not found")

    data = payload.model_dump()
    data["clientID"] = client_id
    if data.get("systemKey"):
        # systemKey is reserved for system-generated reminders; ignore on manual create.
        data["systemKey"] = None
    item = Rappel(**data)
    db.add(item)
    log_activity(
        db,
        entity_type="rappel",
        entity_id=None,
        action="create",
        message=f"Rappel créé pour le client {client_id}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{rappel_id}", response_model=RappelRead)
def update_rappel(rappel_id: int, payload: RappelUpdate, db: Session = Depends(get_db)):
    item = db.get(Rappel, rappel_id)
    if not item:
        raise HTTPException(status_code=404, detail="Rappel not found")
    if payload.clientID is not None and not db.get(Client, payload.clientID):
        raise HTTPException(status_code=400, detail="Client not found")
    if payload.projetID is not None and not db.get(Projet, payload.projetID):
        raise HTTPException(status_code=400, detail="Projet not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        if key == "systemKey":
            continue
        setattr(item, key, value)
    log_activity(
        db,
        entity_type="rappel",
        entity_id=item.id,
        action="update",
        message=f"Rappel {item.id} updated",
    )
    db.commit()
    db.refresh(item)
    return item


@router.post("/generate")
def generate_rappels(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    stats_gen = generate_project_rappels(db, now=now)
    stats_email = send_due_reminder_emails(db, now=now)
    return {"generated": stats_gen, "emails": stats_email}


@router.delete("/{rappel_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rappel(rappel_id: int, db: Session = Depends(get_db)):
    item = db.get(Rappel, rappel_id)
    if not item:
        raise HTTPException(status_code=404, detail="Rappel not found")
    log_activity(
        db,
        entity_type="rappel",
        entity_id=item.id,
        action="delete",
        message=f"Rappel {item.id} deleted",
    )
    db.delete(item)
    db.commit()
    return None

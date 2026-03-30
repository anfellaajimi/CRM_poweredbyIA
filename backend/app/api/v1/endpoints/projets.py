from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
from app.db.session import get_db
from app.models.client import Client
from app.models.projet import Projet
from app.schemas.projet import ProjetCreate, ProjetRead, ProjetUpdate

router = APIRouter(prefix="/projets", tags=["Projets"])


@router.get("", response_model=list[ProjetRead])
def list_projets(db: Session = Depends(get_db)):
    return db.query(Projet).order_by(desc(Projet.isPinned), Projet.id.desc()).all()


@router.get("/{projet_id}", response_model=ProjetRead)
def get_projet(projet_id: int, db: Session = Depends(get_db)):
    item = db.get(Projet, projet_id)
    if not item:
        raise HTTPException(status_code=404, detail="Projet not found")
    return item


@router.post("", response_model=ProjetRead, status_code=status.HTTP_201_CREATED)
def create_projet(payload: ProjetCreate, db: Session = Depends(get_db)):
    client = db.get(Client, payload.clientID)
    if not client:
        raise HTTPException(status_code=400, detail="Client not found")
    item = Projet(**payload.model_dump())
    item.dateMaj = datetime.utcnow()
    db.add(item)
    log_activity(
        db,
        entity_type="projet",
        entity_id=None,
        action="create",
        message=f"Projet {item.nomProjet} created",
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{projet_id}", response_model=ProjetRead)
def update_projet(projet_id: int, payload: ProjetUpdate, db: Session = Depends(get_db)):
    item = db.get(Projet, projet_id)
    if not item:
        raise HTTPException(status_code=404, detail="Projet not found")
    if payload.clientID is not None and not db.get(Client, payload.clientID):
        raise HTTPException(status_code=400, detail="Client not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    item.dateMaj = datetime.utcnow()
    log_activity(
        db,
        entity_type="projet",
        entity_id=item.id,
        action="update",
        message=f"Projet {item.nomProjet} updated",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{projet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_projet(projet_id: int, db: Session = Depends(get_db)):
    item = db.get(Projet, projet_id)
    if not item:
        raise HTTPException(status_code=404, detail="Projet not found")
    log_activity(
        db,
        entity_type="projet",
        entity_id=item.id,
        action="delete",
        message=f"Projet {item.nomProjet} deleted",
    )
    db.delete(item)
    db.commit()
    return None

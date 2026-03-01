from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
from app.db.session import get_db
from app.models.client import Client
from app.models.rappel import Rappel
from app.schemas.rappel import RappelCreate, RappelRead, RappelUpdate

router = APIRouter(prefix="/rappels", tags=["Rappels"])


@router.get("", response_model=list[RappelRead])
def list_rappels(db: Session = Depends(get_db)):
    return db.query(Rappel).order_by(Rappel.id.desc()).all()


@router.get("/{rappel_id}", response_model=RappelRead)
def get_rappel(rappel_id: int, db: Session = Depends(get_db)):
    item = db.get(Rappel, rappel_id)
    if not item:
        raise HTTPException(status_code=404, detail="Rappel not found")
    return item


@router.post("", response_model=RappelRead, status_code=status.HTTP_201_CREATED)
def create_rappel(payload: RappelCreate, db: Session = Depends(get_db)):
    if not db.get(Client, payload.clientID):
        raise HTTPException(status_code=400, detail="Client not found")
    item = Rappel(**payload.model_dump())
    db.add(item)
    log_activity(
        db,
        entity_type="rappel",
        entity_id=None,
        action="create",
        message=f"Rappel created for client {payload.clientID}",
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
    for key, value in payload.model_dump(exclude_unset=True).items():
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

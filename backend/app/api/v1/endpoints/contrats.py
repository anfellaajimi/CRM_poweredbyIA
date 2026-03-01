from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
from app.db.session import get_db
from app.models.client import Client
from app.models.contrat import Contrat
from app.schemas.contrat import ContratCreate, ContratRead, ContratUpdate

router = APIRouter(prefix="/contrats", tags=["Contrats"])


def _compute_needs_renewal(date_fin: date | None, explicit: bool | None = None) -> bool:
    if explicit is not None:
        return explicit
    if not date_fin:
        return False
    return date_fin <= (date.today() + timedelta(days=30))


@router.get("", response_model=list[ContratRead])
def list_contrats(db: Session = Depends(get_db)):
    return db.query(Contrat).order_by(Contrat.contratID.desc()).all()


@router.get("/{contrat_id}", response_model=ContratRead)
def get_contrat(contrat_id: int, db: Session = Depends(get_db)):
    item = db.get(Contrat, contrat_id)
    if not item:
        raise HTTPException(status_code=404, detail="Contrat not found")
    return item


@router.post("", response_model=ContratRead, status_code=status.HTTP_201_CREATED)
def create_contrat(payload: ContratCreate, db: Session = Depends(get_db)):
    if not db.get(Client, payload.clientID):
        raise HTTPException(status_code=400, detail="Client not found")
    data = payload.model_dump()
    data["needsRenewal"] = _compute_needs_renewal(payload.dateFin, payload.needsRenewal)
    if not data.get("titre"):
        data["titre"] = payload.typeContrat
    item = Contrat(**data)
    db.add(item)
    log_activity(
        db,
        entity_type="contrat",
        entity_id=None,
        action="create",
        message=f"Contrat created for client {payload.clientID}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{contrat_id}", response_model=ContratRead)
def update_contrat(contrat_id: int, payload: ContratUpdate, db: Session = Depends(get_db)):
    item = db.get(Contrat, contrat_id)
    if not item:
        raise HTTPException(status_code=404, detail="Contrat not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    item.needsRenewal = _compute_needs_renewal(item.dateFin, payload.needsRenewal)
    if not item.titre:
        item.titre = item.typeContrat
    log_activity(
        db,
        entity_type="contrat",
        entity_id=item.contratID,
        action="update",
        message=f"Contrat {item.contratID} updated",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{contrat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contrat(contrat_id: int, db: Session = Depends(get_db)):
    item = db.get(Contrat, contrat_id)
    if not item:
        raise HTTPException(status_code=404, detail="Contrat not found")
    log_activity(
        db,
        entity_type="contrat",
        entity_id=item.contratID,
        action="delete",
        message=f"Contrat {item.contratID} deleted",
    )
    db.delete(item)
    db.commit()
    return None

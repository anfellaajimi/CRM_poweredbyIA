from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
from app.db.session import get_db
from app.models.cahier_de_charge import CahierDeCharge
from app.models.projet import Projet
from app.schemas.cahier_de_charge import CahierDeChargeCreate, CahierDeChargeRead, CahierDeChargeUpdate

router = APIRouter(prefix="/cahier-de-charge", tags=["CahierDeCharge"])


@router.get("", response_model=list[CahierDeChargeRead])
def list_cahiers(db: Session = Depends(get_db)):
    return db.query(CahierDeCharge).order_by(CahierDeCharge.cahierID.desc()).all()


@router.get("/{cahier_id}", response_model=CahierDeChargeRead)
def get_cahier(cahier_id: int, db: Session = Depends(get_db)):
    item = db.get(CahierDeCharge, cahier_id)
    if not item:
        raise HTTPException(status_code=404, detail="CahierDeCharge not found")
    return item


@router.post("", response_model=CahierDeChargeRead, status_code=status.HTTP_201_CREATED)
def create_cahier(payload: CahierDeChargeCreate, db: Session = Depends(get_db)):
    if not db.get(Projet, payload.projetID):
        raise HTTPException(status_code=400, detail="Projet not found")
    exists = db.query(CahierDeCharge).filter(CahierDeCharge.projetID == payload.projetID).first()
    if exists:
        raise HTTPException(status_code=400, detail="Cahier already exists for this project")
    data = payload.model_dump()
    if data.get("dateCreation") is None:
        data.pop("dateCreation", None)
    item = CahierDeCharge(**data)
    db.add(item)
    log_activity(
        db,
        entity_type="cahier",
        entity_id=item.projetID,
        action="create",
        message=f"Cahier created for project {item.projetID}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{cahier_id}", response_model=CahierDeChargeRead)
def update_cahier(cahier_id: int, payload: CahierDeChargeUpdate, db: Session = Depends(get_db)):
    item = db.get(CahierDeCharge, cahier_id)
    if not item:
        raise HTTPException(status_code=404, detail="CahierDeCharge not found")
    if payload.projetID is not None:
        if not db.get(Projet, payload.projetID):
            raise HTTPException(status_code=400, detail="Projet not found")
        collision = (
            db.query(CahierDeCharge)
            .filter(CahierDeCharge.projetID == payload.projetID, CahierDeCharge.cahierID != cahier_id)
            .first()
        )
        if collision:
            raise HTTPException(status_code=400, detail="Cahier already exists for this project")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    log_activity(
        db,
        entity_type="cahier",
        entity_id=item.projetID,
        action="update",
        message=f"Cahier updated for project {item.projetID}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{cahier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cahier(cahier_id: int, db: Session = Depends(get_db)):
    item = db.get(CahierDeCharge, cahier_id)
    if not item:
        raise HTTPException(status_code=404, detail="CahierDeCharge not found")
    log_activity(
        db,
        entity_type="cahier",
        entity_id=item.projetID,
        action="delete",
        message=f"Cahier deleted for project {item.projetID}",
    )
    db.delete(item)
    db.commit()
    return None

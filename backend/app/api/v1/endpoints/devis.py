from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.devis import Devis
from app.models.projet import Projet
from app.schemas.devis import DevisCreate, DevisRead, DevisUpdate

router = APIRouter(prefix="/devis", tags=["Devis"])


@router.get("", response_model=list[DevisRead])
def list_devis(db: Session = Depends(get_db)):
    return db.query(Devis).order_by(Devis.devisID.desc()).all()


@router.get("/{devis_id}", response_model=DevisRead)
def get_devis(devis_id: int, db: Session = Depends(get_db)):
    item = db.get(Devis, devis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Devis not found")
    return item


@router.post("", response_model=DevisRead, status_code=status.HTTP_201_CREATED)
def create_devis(payload: DevisCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"projetIDs"})
    if data.get("dateDevis") is None:
        data.pop("dateDevis", None)

    item = Devis(**data)
    if payload.projetIDs:
        projets = db.query(Projet).filter(Projet.id.in_(payload.projetIDs)).all()
        item.projets = projets

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{devis_id}", response_model=DevisRead)
def update_devis(devis_id: int, payload: DevisUpdate, db: Session = Depends(get_db)):
    item = db.get(Devis, devis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Devis not found")

    update_data = payload.model_dump(exclude_unset=True, exclude={"projetIDs"})
    for key, value in update_data.items():
        setattr(item, key, value)

    if payload.projetIDs is not None:
        projets = db.query(Projet).filter(Projet.id.in_(payload.projetIDs)).all()
        item.projets = projets

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{devis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_devis(devis_id: int, db: Session = Depends(get_db)):
    item = db.get(Devis, devis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Devis not found")
    db.delete(item)
    db.commit()
    return None

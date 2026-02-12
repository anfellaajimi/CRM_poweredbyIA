from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.facture import Facture
from app.models.projet import Projet
from app.schemas.facture import FactureCreate, FactureRead, FactureUpdate

router = APIRouter(prefix="/factures", tags=["Factures"])


@router.get("", response_model=list[FactureRead])
def list_factures(db: Session = Depends(get_db)):
    return db.query(Facture).order_by(Facture.factureID.desc()).all()


@router.get("/{facture_id}", response_model=FactureRead)
def get_facture(facture_id: int, db: Session = Depends(get_db)):
    item = db.get(Facture, facture_id)
    if not item:
        raise HTTPException(status_code=404, detail="Facture not found")
    return item


@router.post("", response_model=FactureRead, status_code=status.HTTP_201_CREATED)
def create_facture(payload: FactureCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"projetIDs"})
    if data.get("dateFacture") is None:
        data.pop("dateFacture", None)

    item = Facture(**data)
    if payload.projetIDs:
        projets = db.query(Projet).filter(Projet.id.in_(payload.projetIDs)).all()
        item.projets = projets

    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{facture_id}", response_model=FactureRead)
def update_facture(facture_id: int, payload: FactureUpdate, db: Session = Depends(get_db)):
    item = db.get(Facture, facture_id)
    if not item:
        raise HTTPException(status_code=404, detail="Facture not found")

    update_data = payload.model_dump(exclude_unset=True, exclude={"projetIDs"})
    for key, value in update_data.items():
        setattr(item, key, value)

    if payload.projetIDs is not None:
        projets = db.query(Projet).filter(Projet.id.in_(payload.projetIDs)).all()
        item.projets = projets

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{facture_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_facture(facture_id: int, db: Session = Depends(get_db)):
    item = db.get(Facture, facture_id)
    if not item:
        raise HTTPException(status_code=404, detail="Facture not found")
    db.delete(item)
    db.commit()
    return None

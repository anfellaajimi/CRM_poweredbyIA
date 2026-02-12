from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.contrat import Contrat
from app.schemas.contrat import ContratCreate, ContratRead, ContratUpdate

router = APIRouter(prefix="/contrats", tags=["Contrats"])


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
    item = Contrat(**payload.model_dump())
    db.add(item)
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
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{contrat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contrat(contrat_id: int, db: Session = Depends(get_db)):
    item = db.get(Contrat, contrat_id)
    if not item:
        raise HTTPException(status_code=404, detail="Contrat not found")
    db.delete(item)
    db.commit()
    return None

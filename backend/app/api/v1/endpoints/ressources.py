from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.ressource import Ressource
from app.schemas.ressource import RessourceCreate, RessourceRead, RessourceUpdate

router = APIRouter(prefix="/ressources", tags=["Ressources"])


@router.get("", response_model=list[RessourceRead])
def list_ressources(db: Session = Depends(get_db)):
    return db.query(Ressource).order_by(Ressource.ressourceID.desc()).all()


@router.get("/{ressource_id}", response_model=RessourceRead)
def get_ressource(ressource_id: int, db: Session = Depends(get_db)):
    item = db.get(Ressource, ressource_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ressource not found")
    return item


@router.post("", response_model=RessourceRead, status_code=status.HTTP_201_CREATED)
def create_ressource(payload: RessourceCreate, db: Session = Depends(get_db)):
    item = Ressource(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{ressource_id}", response_model=RessourceRead)
def update_ressource(ressource_id: int, payload: RessourceUpdate, db: Session = Depends(get_db)):
    item = db.get(Ressource, ressource_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ressource not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{ressource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ressource(ressource_id: int, db: Session = Depends(get_db)):
    item = db.get(Ressource, ressource_id)
    if not item:
        raise HTTPException(status_code=404, detail="Ressource not found")
    db.delete(item)
    db.commit()
    return None

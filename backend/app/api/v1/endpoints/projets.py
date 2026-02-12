from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.projet import Projet
from app.schemas.projet import ProjetCreate, ProjetRead, ProjetUpdate

router = APIRouter(prefix="/projets", tags=["Projets"])


@router.get("", response_model=list[ProjetRead])
def list_projets(db: Session = Depends(get_db)):
    return db.query(Projet).order_by(Projet.id.desc()).all()


@router.get("/{projet_id}", response_model=ProjetRead)
def get_projet(projet_id: int, db: Session = Depends(get_db)):
    item = db.get(Projet, projet_id)
    if not item:
        raise HTTPException(status_code=404, detail="Projet not found")
    return item


@router.post("", response_model=ProjetRead, status_code=status.HTTP_201_CREATED)
def create_projet(payload: ProjetCreate, db: Session = Depends(get_db)):
    item = Projet(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{projet_id}", response_model=ProjetRead)
def update_projet(projet_id: int, payload: ProjetUpdate, db: Session = Depends(get_db)):
    item = db.get(Projet, projet_id)
    if not item:
        raise HTTPException(status_code=404, detail="Projet not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{projet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_projet(projet_id: int, db: Session = Depends(get_db)):
    item = db.get(Projet, projet_id)
    if not item:
        raise HTTPException(status_code=404, detail="Projet not found")
    db.delete(item)
    db.commit()
    return None

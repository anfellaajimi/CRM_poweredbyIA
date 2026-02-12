from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.acces import Acces
from app.schemas.acces import AccesCreate, AccesRead, AccesUpdate

router = APIRouter(prefix="/acces", tags=["Acces"])


@router.get("", response_model=list[AccesRead])
def list_acces(db: Session = Depends(get_db)):
    return db.query(Acces).order_by(Acces.accesID.desc()).all()


@router.get("/{acces_id}", response_model=AccesRead)
def get_acces(acces_id: int, db: Session = Depends(get_db)):
    item = db.get(Acces, acces_id)
    if not item:
        raise HTTPException(status_code=404, detail="Acces not found")
    return item


@router.post("", response_model=AccesRead, status_code=status.HTTP_201_CREATED)
def create_acces(payload: AccesCreate, db: Session = Depends(get_db)):
    item = Acces(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{acces_id}", response_model=AccesRead)
def update_acces(acces_id: int, payload: AccesUpdate, db: Session = Depends(get_db)):
    item = db.get(Acces, acces_id)
    if not item:
        raise HTTPException(status_code=404, detail="Acces not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{acces_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_acces(acces_id: int, db: Session = Depends(get_db)):
    item = db.get(Acces, acces_id)
    if not item:
        raise HTTPException(status_code=404, detail="Acces not found")
    db.delete(item)
    db.commit()
    return None

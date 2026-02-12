from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.utilisateur import Utilisateur
from app.schemas.utilisateur import UtilisateurCreate, UtilisateurRead, UtilisateurUpdate

router = APIRouter(prefix="/utilisateurs", tags=["Utilisateurs"])


@router.get("", response_model=list[UtilisateurRead])
def list_utilisateurs(db: Session = Depends(get_db)):
    return db.query(Utilisateur).order_by(Utilisateur.userID.desc()).all()


@router.post("/seed/admin", response_model=UtilisateurRead, status_code=status.HTTP_201_CREATED)
def seed_admin_utilisateur(db: Session = Depends(get_db)):
    payload = {
        "nom": "Anfel Ajimi",
        "email": "admin@gmail.com",
        "role": "developpeur",
        "actif": True,
        "motDePasse": "admin123",
    }

    existing = db.query(Utilisateur).filter(Utilisateur.email == payload["email"]).first()
    if existing:
        for key, value in payload.items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing

    item = Utilisateur(**payload)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/{user_id}", response_model=UtilisateurRead)
def get_utilisateur(user_id: int, db: Session = Depends(get_db)):
    item = db.get(Utilisateur, user_id)
    if not item:
        raise HTTPException(status_code=404, detail="Utilisateur not found")
    return item


@router.post("", response_model=UtilisateurRead, status_code=status.HTTP_201_CREATED)
def create_utilisateur(payload: UtilisateurCreate, db: Session = Depends(get_db)):
    exists = db.query(Utilisateur).filter(Utilisateur.email == payload.email).first()
    if exists:
        raise HTTPException(status_code=400, detail="Utilisateur email already exists")
    item = Utilisateur(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{user_id}", response_model=UtilisateurRead)
def update_utilisateur(user_id: int, payload: UtilisateurUpdate, db: Session = Depends(get_db)):
    item = db.get(Utilisateur, user_id)
    if not item:
        raise HTTPException(status_code=404, detail="Utilisateur not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_utilisateur(user_id: int, db: Session = Depends(get_db)):
    item = db.get(Utilisateur, user_id)
    if not item:
        raise HTTPException(status_code=404, detail="Utilisateur not found")
    db.delete(item)
    db.commit()
    return None

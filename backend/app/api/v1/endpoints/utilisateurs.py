from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
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
    log_activity(
        db,
        entity_type="utilisateur",
        entity_id=None,
        action="create",
        message=f"Utilisateur {payload.email} créé",
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{user_id}", response_model=UtilisateurRead)
def update_utilisateur(user_id: int, payload: UtilisateurUpdate, db: Session = Depends(get_db)):
    item = db.get(Utilisateur, user_id)
    if not item:
        raise HTTPException(status_code=404, detail="Utilisateur not found")
    update_data = payload.model_dump(exclude_unset=True)
    if "email" in update_data:
        exists = db.query(Utilisateur).filter(Utilisateur.email == update_data["email"], Utilisateur.userID != user_id).first()
        if exists:
            raise HTTPException(status_code=400, detail="Utilisateur email already exists")
    if update_data.get("motDePasse", None) == "":
        update_data.pop("motDePasse", None)
    for key, value in update_data.items():
        setattr(item, key, value)
    log_activity(
        db,
        entity_type="utilisateur",
        entity_id=item.userID,
        action="update",
        message=f"Utilisateur {item.email} updated",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_utilisateur(user_id: int, db: Session = Depends(get_db)):
    item = db.get(Utilisateur, user_id)
    if not item:
        raise HTTPException(status_code=404, detail="Utilisateur not found")
    first_user = db.query(Utilisateur).order_by(Utilisateur.userID.asc()).first()
    if first_user and item.userID == first_user.userID:
        raise HTTPException(status_code=409, detail="First user cannot be removed")
    if item.projets:
        raise HTTPException(status_code=409, detail="Cannot delete user assigned to projects")
    log_activity(
        db,
        entity_type="utilisateur",
        entity_id=item.userID,
        action="delete",
        message=f"Utilisateur {item.email} deleted",
    )
    db.delete(item)
    db.commit()
    return None

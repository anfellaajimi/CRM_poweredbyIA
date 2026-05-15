from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import timedelta

from app.db.session import get_db
from app.models.client_portal_user import ClientPortalUser
from app.models.client import Client
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings

router = APIRouter(prefix="/client-auth", tags=["Client Authentication"])

class ClientLoginRequest(BaseModel):
    email: EmailStr
    password: str

class ClientSignupRequest(BaseModel):
    email: EmailStr
    password: str
    nom: str

class ClientAuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

@router.post("/login", response_model=ClientAuthResponse)
def client_login(payload: ClientLoginRequest, db: Session = Depends(get_db)):
    user = db.query(ClientPortalUser).filter(ClientPortalUser.email == payload.email).first()
    if not user or not verify_password(payload.password, user.motDePasse):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Email ou mot de passe incorrect")
    
    if not user.isActive:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Compte désactivé")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "user_type": "client"},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.email.split('@')[0], # Fallback name
            "email": user.email,
            "role": "client",
            "clientID": user.clientID
        }
    }

@router.post("/signup", response_model=ClientAuthResponse)
def client_signup(payload: ClientSignupRequest, db: Session = Depends(get_db)):
    # 1. Check if email is "invited" (exists in clients table)
    client_record = db.query(Client).filter(Client.email == payload.email).first()
    if not client_record:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Votre email n'est pas autorisé à s'inscrire. Veuillez contacter l'administrateur."
        )
    
    # 2. Check if already registered
    existing_user = db.query(ClientPortalUser).filter(ClientPortalUser.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Cet email est déjà enregistré."
        )
    
    # 3. Create user
    new_user = ClientPortalUser(
        email=payload.email,
        motDePasse=get_password_hash(payload.password),
        clientID=client_record.id,
        isActive=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id), "user_type": "client"},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "name": payload.nom,
            "email": new_user.email,
            "role": "client",
            "clientID": new_user.clientID
        }
    }

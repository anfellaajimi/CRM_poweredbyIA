from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.utilisateur import Utilisateur

router = APIRouter(prefix="/auth", tags=["Auth"])

_TOKENS: dict[str, int] = {}


class LoginRequest(BaseModel):
    email: EmailStr
    motDePasse: str


class RegisterRequest(BaseModel):
    nom: str
    email: EmailStr
    motDePasse: str
    role: str = "developpeur"


class AuthResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict


def _to_user_payload(user: Utilisateur) -> dict:
    return {
        "id": str(user.userID),
        "name": user.nom,
        "email": user.email,
        "role": user.role,
        "actif": user.actif,
        "avatar": user.avatarUrl,
    }


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Utilisateur).filter(Utilisateur.email == payload.email).first()
    if not user or user.motDePasse != payload.motDePasse:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = str(uuid4())
    _TOKENS[token] = user.userID
    return {"access_token": token, "token_type": "bearer", "user": _to_user_payload(user)}


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Utilisateur).filter(Utilisateur.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Utilisateur email already exists")

    user = Utilisateur(
        nom=payload.nom,
        email=payload.email,
        motDePasse=payload.motDePasse,
        role=payload.role,
        actif=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = str(uuid4())
    _TOKENS[token] = user.userID
    return {"access_token": token, "token_type": "bearer", "user": _to_user_payload(user)}


class UserUpdateRequest(BaseModel):
    nom: str
    email: EmailStr
    avatar: str | None = None

@router.get("/me")
def me(authorization: str | None = None, db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    user_id = _TOKENS.get(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.get(Utilisateur, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    return _to_user_payload(user)

@router.put("/me")
def update_me(payload: UserUpdateRequest, authorization: str | None = None, db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()
    user_id = _TOKENS.get(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.get(Utilisateur, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user.nom = payload.nom
    user.email = payload.email
    if payload.avatar is not None:
        user.avatarUrl = payload.avatar if payload.avatar.strip() != "" else None
    else:
        # If payload.avatar is explicitly None, it clears it.
        # But wait, in Pydantic, if it is omitted it's None. We need to be careful.
        # It's better to just set it.
        if "avatar" in payload.model_fields_set:
            user.avatarUrl = payload.avatar

    db.commit()
    db.refresh(user)

    return _to_user_payload(user)


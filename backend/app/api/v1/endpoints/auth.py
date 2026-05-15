from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from fastapi.responses import RedirectResponse
from jose import jwt, JWTError
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from authlib.integrations.starlette_client import OAuth

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.utilisateur import Utilisateur

router = APIRouter(prefix="/auth", tags=["Auth"])

# OAuth configuration
oauth = OAuth()
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

oauth.register(
    name='github',
    client_id=settings.GITHUB_CLIENT_ID,
    client_secret=settings.GITHUB_CLIENT_SECRET,
    access_token_url='https://github.com/login/oauth/access_token',
    access_token_params=None,
    authorize_url='https://github.com/login/oauth/authorize',
    authorize_params=None,
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'},
)

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

def get_current_user(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Utilisateur:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = authorization.split(" ", 1)[1].strip()
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        
    user_type: str = payload.get("user_type", "staff")
    
    if user_type == "client":
        from app.models.client_portal_user import ClientPortalUser
        user = db.get(ClientPortalUser, int(user_id))
    else:
        user = db.get(Utilisateur, int(user_id))
        
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Utilisateur).filter(Utilisateur.email == payload.email).first()
    # Check for plain text (legacy) or hashed password
    if not user or not user.motDePasse:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    is_valid = False
    try:
        is_valid = verify_password(payload.motDePasse, user.motDePasse)
    except Exception:
        # Fallback to plain text for legacy users
        is_valid = (payload.motDePasse == user.motDePasse)
        if is_valid:
            # Auto-upgrade to hashed password
            user.motDePasse = get_password_hash(payload.motDePasse)
            db.commit()

    if not is_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token(data={"sub": str(user.userID), "user_type": "staff"})
    return {"access_token": token, "token_type": "bearer", "user": _to_user_payload(user)}


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(Utilisateur).filter(Utilisateur.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Utilisateur email already exists")

    user = Utilisateur(
        nom=payload.nom,
        email=payload.email,
        motDePasse=get_password_hash(payload.motDePasse),
        role=payload.role,
        actif=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(data={"sub": str(user.userID), "user_type": "staff"})
    return {"access_token": token, "token_type": "bearer", "user": _to_user_payload(user)}


@router.get("/google")
async def google_login(request: Request):
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {str(e)}")
        
    user_info = token.get('userinfo')
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to get user info from Google")
    
    email = user_info.get('email')
    name = user_info.get('name')
    google_id = user_info.get('sub')
    avatar = user_info.get('picture')

    user = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if not user:
        user = Utilisateur(
            nom=name,
            email=email,
            oauth_provider="google",
            oauth_id=google_id,
            avatarUrl=avatar,
            actif=True,
            role="developpeur"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.oauth_provider = "google"
        user.oauth_id = google_id
        if not user.avatarUrl:
            user.avatarUrl = avatar
        db.commit()

    jwt_token = create_access_token(data={"sub": str(user.userID), "user_type": "staff"})
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?token={jwt_token}")


@router.get("/github")
async def github_login(request: Request):
    redirect_uri = request.url_for('github_callback')
    return await oauth.github.authorize_redirect(request, redirect_uri)


@router.get("/github/callback")
async def github_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.github.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {str(e)}")
        
    resp = await oauth.github.get('user', token=token)
    user_info = resp.json()
    
    email_resp = await oauth.github.get('user/emails', token=token)
    emails = email_resp.json()
    email = next((e['email'] for e in emails if e['primary'] and e['verified']), None)
    
    if not email:
        raise HTTPException(status_code=400, detail="Failed to get verified email from GitHub")

    name = user_info.get('name') or user_info.get('login')
    github_id = str(user_info.get('id'))
    avatar = user_info.get('avatar_url')

    user = db.query(Utilisateur).filter(Utilisateur.email == email).first()
    if not user:
        user = Utilisateur(
            nom=name,
            email=email,
            oauth_provider="github",
            oauth_id=github_id,
            avatarUrl=avatar,
            actif=True,
            role="developpeur"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.oauth_provider = "github"
        user.oauth_id = github_id
        if not user.avatarUrl:
            user.avatarUrl = avatar
        db.commit()

    jwt_token = create_access_token(data={"sub": str(user.userID), "user_type": "staff"})
    return RedirectResponse(url=f"{settings.FRONTEND_URL}/login?token={jwt_token}")

@router.get("/me")
def me(current_user: Utilisateur = Depends(get_current_user)):
    return _to_user_payload(current_user)

class UserUpdateRequest(BaseModel):
    nom: str
    email: EmailStr
    avatar: str | None = None

class ChangePasswordRequest(BaseModel):
    currentPassword: str
    newPassword: str


@router.put("/me")
def update_me(payload: UserUpdateRequest, current_user: Utilisateur = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.nom = payload.nom
    current_user.email = payload.email
    if payload.avatar is not None:
        current_user.avatarUrl = payload.avatar if payload.avatar.strip() != "" else None
    
    db.commit()
    db.refresh(current_user)
    return _to_user_payload(current_user)

@router.put("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    current_user: Utilisateur = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.motDePasse:
        raise HTTPException(status_code=400, detail="Cet utilisateur n'a pas de mot de passe local défini.")

    if not verify_password(payload.currentPassword, current_user.motDePasse):
        raise HTTPException(status_code=400, detail="L'ancien mot de passe est incorrect.")

    current_user.motDePasse = get_password_hash(payload.newPassword)
    db.commit()
    return {"message": "Mot de passe mis à jour avec succès"}


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any, Union

from app.api.v1.endpoints.auth import get_current_user
from app.db.session import get_db
from app.models.utilisateur import Utilisateur
from app.models.projet import Projet
from app.models.devis import Devis
from app.models.facture import Facture
from app.models.contrat import Contrat
from app.models.client import Client

from app.models.client_portal_user import ClientPortalUser

router = APIRouter(prefix="/client-portal", tags=["Client Portal"])

def get_client_user(current_user: Union[Utilisateur, ClientPortalUser] = Depends(get_current_user)) -> Union[Utilisateur, ClientPortalUser]:
    # Use hasattr to be safe or check user_type from payload if we had it here, 
    # but role property we added will work.
    role = getattr(current_user, "role", "").lower()
    if role != "client" or not getattr(current_user, "clientID", None):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux clients"
        )
    return current_user

from pydantic import BaseModel

class ClientProfileUpdate(BaseModel):
    nom: str | None = None
    email: str | None = None
    tel: str | None = None
    adresse: str | None = None
    entreprise: str | None = None
    raisonSociale: str | None = None

@router.get("/me")
def get_client_profile(
    current_user: Union[Utilisateur, ClientPortalUser] = Depends(get_client_user),
    db: Session = Depends(get_db)
):
    client_id = getattr(current_user, "clientID")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    # Handle different ID attribute names
    user_id = getattr(current_user, "id", getattr(current_user, "userID", None))
    
    return {
        "user": {
            "id": user_id,
            "name": getattr(current_user, "nom", ""),
            "email": current_user.email,
            "avatar": getattr(current_user, "avatarUrl", "")
        },
        "client": client
    }

@router.put("/me")
def update_client_profile(
    payload: ClientProfileUpdate,
    current_user: Union[Utilisateur, ClientPortalUser] = Depends(get_client_user),
    db: Session = Depends(get_db)
):
    client_id = getattr(current_user, "clientID")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client non trouvé")
    
    if payload.nom is not None:
        client.nom = payload.nom
    if payload.email is not None:
        client.email = payload.email
        current_user.email = payload.email
    if payload.tel is not None:
        client.tel = payload.tel
    if payload.adresse is not None:
        client.adresse = payload.adresse
    if payload.entreprise is not None:
        client.entreprise = payload.entreprise
    if payload.raisonSociale is not None:
        client.raisonSociale = payload.raisonSociale
        
    db.commit()
    return {"status": "success"}

@router.get("/projects")
def get_client_projects(
    current_user: Any = Depends(get_client_user),
    db: Session = Depends(get_db)
):
    client_id = getattr(current_user, "clientID")
    projects = db.query(Projet).filter(Projet.clientID == client_id).all()
    return projects

@router.get("/projects/{project_id}")
def get_client_project_details(
    project_id: int,
    current_user: Any = Depends(get_client_user),
    db: Session = Depends(get_db)
):
    client_id = getattr(current_user, "clientID")
    project = db.query(Projet).filter(
        Projet.projetID == project_id,
        Projet.clientID == client_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return project

@router.get("/documents/devis")
def get_client_devis(
    current_user: Any = Depends(get_client_user),
    db: Session = Depends(get_db)
):
    client_id = getattr(current_user, "clientID")
    devis = db.query(Devis).filter(Devis.clientID == client_id).all()
    return devis

@router.get("/documents/factures")
def get_client_factures(
    current_user: Any = Depends(get_client_user),
    db: Session = Depends(get_db)
):
    client_id = getattr(current_user, "clientID")
    factures = db.query(Facture).filter(Facture.clientID == client_id).all()
    return factures

@router.get("/documents/contracts")
def get_client_contracts(
    current_user: Any = Depends(get_client_user),
    db: Session = Depends(get_db)
):
    client_id = getattr(current_user, "clientID")
    contracts = db.query(Contrat).filter(Contrat.clientID == client_id).all()
    return contracts

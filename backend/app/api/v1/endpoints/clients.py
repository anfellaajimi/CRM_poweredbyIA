from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import or_, cast, String, func

from app.db.session import get_db
from app.models.client import Client
from app.models.projet import Projet
from app.api.v1.endpoints._activity import log_activity
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate

router = APIRouter(prefix="/clients", tags=["Clients"])


def _label_from_score(score: float) -> str:
    if score >= 70:
        return "Haute"
    if score >= 40:
        return "Moyen"
    return "Faible"


@router.get("", response_model=list[ClientRead])
def list_clients(q: Optional[str] = None, client_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Client)
    if q:
        # Strip common prefixes from search query if potentially an ID
        clean_q = q.upper().replace("CL", "").replace("CM", "")
        search_filter = or_(
            Client.nom.ilike(f"%{q}%"),
            Client.email.ilike(f"%{q}%"),
            cast(Client.id, String).ilike(f"%{q}%"),
            cast(Client.numSequence, String).ilike(f"%{clean_q}%")
        )
        query = query.filter(search_filter)
    if client_id:
        clean_id = client_id.upper().replace("CL", "").replace("CM", "")
        query = query.filter(cast(Client.numSequence, String).ilike(f"%{clean_id}%"))
    return query.order_by(Client.id.desc()).all()


@router.get("/{client_id}", response_model=ClientRead)
def get_client(client_id: int, db: Session = Depends(get_db)):
    item = db.get(Client, client_id)
    if not item:
        raise HTTPException(status_code=404, detail="Client not found")
    return item


@router.post("", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
def create_client(payload: ClientCreate, db: Session = Depends(get_db)):
    if payload.email:
        exists = db.query(Client).filter(Client.email == payload.email).first()
        if exists:
            raise HTTPException(status_code=400, detail="L'adresse email du client existe déjà")
    
    # Calculate next sequence number for this specific type
    max_seq = db.query(func.max(Client.numSequence)).filter(Client.typeClient == payload.typeClient).scalar() or 0
    next_seq = max_seq + 1
    
    item = Client(**payload.model_dump())
    item.numSequence = next_seq
    
    if not item.entreprise and item.typeClient.lower() == "moral":
        item.entreprise = item.nom
    db.add(item)
    log_activity(
        db,
        entity_type="client",
        entity_id=None,
        action="create",
        message=f"Client {item.nom} créé",
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{client_id}", response_model=ClientRead)
def update_client(client_id: int, payload: ClientUpdate, db: Session = Depends(get_db)):
    item = db.get(Client, client_id)
    if not item:
        raise HTTPException(status_code=404, detail="Client not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    log_activity(
        db,
        entity_type="client",
        entity_id=item.id,
        action="update",
        message=f"Client {item.nom} mis à jour",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    item = db.get(Client, client_id)
    if not item:
        raise HTTPException(status_code=404, detail="Client not found")
    log_activity(
        db,
        entity_type="client",
        entity_id=item.id,
        action="delete",
        message=f"Client {item.nom} supprimé",
    )
    db.delete(item)
    db.commit()
    return None


@router.post("/ai-scoring/recompute")
def recompute_ai_scoring(db: Session = Depends(get_db)):
    clients = db.query(Client).all()
    results = []

    for c in clients:
        score = 0.0
        reasons: list[str] = []

        if c.email:
            score += 20
            reasons.append("email present")
        if c.tel:
            score += 10
            reasons.append("phone present")
        if c.adresse:
            score += 10
            reasons.append("address present")
        if c.matriculeFiscale:
            score += 10
            reasons.append("tax id present")
        if c.secteurActivite:
            score += 10
            reasons.append("industry present")
        if c.entreprise:
            score += 5

        projects = db.query(Projet).filter(Projet.clientID == c.id).all()
        total_projects = len(projects)
        if total_projects >= 3:
            score += 15
            reasons.append("project volume")
        elif total_projects >= 1:
            score += 8

        if total_projects:
            avg_progress = sum(float(p.progression or 0) for p in projects) / total_projects
            done_count = sum(1 for p in projects if (p.status or "").lower() in {"termine", "completed", "done"})
            if avg_progress >= 70:
                score += 15
                reasons.append("good progress")
            elif avg_progress >= 40:
                score += 8
            if done_count >= 1:
                score += 10
                reasons.append("completed projects")

        if (c.status or "").lower() == "actif":
            score += 10
        else:
            score -= 10

        score = max(0.0, min(100.0, score))
        results.append(
            {
                "client_id": c.id,
                "ai_score_value": round(score, 1),
                "ai_scoring": _label_from_score(score),
                "reasons": reasons[:4],
            }
        )

    return {"items": results}

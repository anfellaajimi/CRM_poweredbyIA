from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.client import Client
from app.api.v1.endpoints._activity import log_activity
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate

router = APIRouter(prefix="/clients", tags=["Clients"])


@router.get("", response_model=list[ClientRead])
def list_clients(db: Session = Depends(get_db)):
    return db.query(Client).order_by(Client.id.desc()).all()


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
            raise HTTPException(status_code=400, detail="Client email already exists")
    item = Client(**payload.model_dump())
    if not item.entreprise and item.typeClient.lower() == "moral":
        item.entreprise = item.nom
    db.add(item)
    log_activity(
        db,
        entity_type="client",
        entity_id=None,
        action="create",
        message=f"Client {item.nom} created",
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
        message=f"Client {item.nom} updated",
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
        message=f"Client {item.nom} deleted",
    )
    db.delete(item)
    db.commit()
    return None

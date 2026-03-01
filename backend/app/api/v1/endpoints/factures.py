from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
from app.db.session import get_db
from app.models.client import Client
from app.models.facture import Facture
from app.models.facture_item import FactureItem
from app.models.projet import Projet
from app.schemas.facture import FactureCreate, FactureRead, FactureUpdate

router = APIRouter(prefix="/factures", tags=["Factures"])


def _to_items(items_payload):
    items = []
    total_ht = 0.0
    for item in items_payload:
        line_total = float(item.quantity) * float(item.unitPrice)
        total_ht += line_total
        items.append(
            FactureItem(
                description=item.description,
                quantity=item.quantity,
                unitPrice=item.unitPrice,
                lineTotal=line_total,
            )
        )
    return items, total_ht


@router.get("", response_model=list[FactureRead])
def list_factures(db: Session = Depends(get_db)):
    return db.query(Facture).order_by(Facture.factureID.desc()).all()


@router.get("/{facture_id}", response_model=FactureRead)
def get_facture(facture_id: int, db: Session = Depends(get_db)):
    item = db.get(Facture, facture_id)
    if not item:
        raise HTTPException(status_code=404, detail="Facture not found")
    return item


@router.post("", response_model=FactureRead, status_code=status.HTTP_201_CREATED)
def create_facture(payload: FactureCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"projetIDs", "items"})
    if data.get("dateFacture") is None:
        data.pop("dateFacture", None)

    if not db.get(Client, payload.clientID):
        raise HTTPException(status_code=400, detail="Client not found")

    item = Facture(**data)
    items, amount_ht = _to_items(payload.items)
    item.items = items
    item.amountHT = amount_ht
    item.amountTTC = round(amount_ht * (1 + float(item.taxRate or payload.taxRate) / 100), 2)
    if payload.projetIDs:
        projets = db.query(Projet).filter(Projet.id.in_(payload.projetIDs)).all()
        item.projets = projets

    db.add(item)
    log_activity(
        db,
        entity_type="facture",
        entity_id=None,
        action="create",
        message=f"Facture created for client {payload.clientID}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{facture_id}", response_model=FactureRead)
def update_facture(facture_id: int, payload: FactureUpdate, db: Session = Depends(get_db)):
    item = db.get(Facture, facture_id)
    if not item:
        raise HTTPException(status_code=404, detail="Facture not found")

    update_data = payload.model_dump(exclude_unset=True, exclude={"projetIDs", "items"})
    for key, value in update_data.items():
        setattr(item, key, value)

    if payload.items is not None:
        item.items.clear()
        items, amount_ht = _to_items(payload.items)
        item.items = items
        item.amountHT = amount_ht
        current_tax = payload.taxRate if payload.taxRate is not None else float(item.taxRate)
        item.amountTTC = round(amount_ht * (1 + float(current_tax) / 100), 2)

    if payload.projetIDs is not None:
        projets = db.query(Projet).filter(Projet.id.in_(payload.projetIDs)).all()
        item.projets = projets

    log_activity(
        db,
        entity_type="facture",
        entity_id=item.factureID,
        action="update",
        message=f"Facture {item.factureID} updated",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{facture_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_facture(facture_id: int, db: Session = Depends(get_db)):
    item = db.get(Facture, facture_id)
    if not item:
        raise HTTPException(status_code=404, detail="Facture not found")
    log_activity(
        db,
        entity_type="facture",
        entity_id=item.factureID,
        action="delete",
        message=f"Facture {item.factureID} deleted",
    )
    db.delete(item)
    db.commit()
    return None

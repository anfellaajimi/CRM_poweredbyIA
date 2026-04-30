from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import io
from fpdf import FPDF
from app.utils.pdf_generator import generate_pdf
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
from app.db.session import get_db
from app.models.client import Client
from app.models.devis import Devis
from app.models.devis_item import DevisItem
from app.models.projet import Projet
from app.schemas.devis import DevisCreate, DevisRead, DevisUpdate

router = APIRouter(prefix="/devis", tags=["Devis"])


def _to_items(items_payload):
    items = []
    total = 0.0
    for item in items_payload:
        line_total = float(item.quantity) * float(item.unitPrice)
        total += line_total
        items.append(
            DevisItem(
                description=item.description,
                quantity=item.quantity,
                unitPrice=item.unitPrice,
                lineTotal=line_total,
            )
        )
    return items, total


@router.get("", response_model=list[DevisRead])
def list_devis(db: Session = Depends(get_db)):
    return db.query(Devis).order_by(Devis.devisID.desc()).all()


@router.get("/{devis_id}", response_model=DevisRead)
def get_devis(devis_id: int, db: Session = Depends(get_db)):
    item = db.get(Devis, devis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Devis not found")
    return item


@router.post("", response_model=DevisRead, status_code=status.HTTP_201_CREATED)
def create_devis(payload: DevisCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"projetIDs", "items"})
    if data.get("dateDevis") is None:
        data.pop("dateDevis", None)

    if not db.get(Client, payload.clientID):
        raise HTTPException(status_code=400, detail="Client not found")

    item = Devis(**data)
    items, total = _to_items(payload.items)
    item.items = items
    item.totalAmount = total
    if payload.projetIDs:
        projets = db.query(Projet).filter(Projet.id.in_(payload.projetIDs)).all()
        item.projets = projets

    db.add(item)
    log_activity(
        db,
        entity_type="devis",
        entity_id=None,
        action="create",
        message=f"Devis créé pour le client {payload.clientID}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{devis_id}", response_model=DevisRead)
def update_devis(devis_id: int, payload: DevisUpdate, db: Session = Depends(get_db)):
    item = db.get(Devis, devis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Devis not found")

    update_data = payload.model_dump(exclude_unset=True, exclude={"projetIDs", "items"})
    for key, value in update_data.items():
        setattr(item, key, value)

    if payload.items is not None:
        item.items.clear()
        items, total = _to_items(payload.items)
        item.items = items
        item.totalAmount = total

    if payload.projetIDs is not None:
        projets = db.query(Projet).filter(Projet.id.in_(payload.projetIDs)).all()
        item.projets = projets

    log_activity(
        db,
        entity_type="devis",
        entity_id=item.devisID,
        action="update",
        message=f"Devis {item.devisID} updated",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{devis_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_devis(devis_id: int, db: Session = Depends(get_db)):
    item = db.get(Devis, devis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Devis not found")
    log_activity(
        db,
        entity_type="devis",
        entity_id=item.devisID,
        action="delete",
        message=f"Devis {item.devisID} deleted",
    )
    db.delete(item)
    db.commit()
    return None


@router.get("/{devis_id}/pdf")
def export_devis_pdf(devis_id: int, db: Session = Depends(get_db)):
    item = db.get(Devis, devis_id)
    if not item:
        raise HTTPException(status_code=404, detail="Devis not found")

    pdf_bytes = generate_pdf(
        title_type="DEVIS",
        ref=f"DEV-{item.devisID}",
        date_str=item.dateDevis.strftime('%d/%m/%Y'),
        client=item.client,
        items=item.items,
        amount_ht=item.totalAmount,
        tax_rate=19.0, # Default per template
        amount_ttc=round(float(item.totalAmount) * 1.19, 3), # Simplification for Devis
        currency=item.client.devise or "DT"
    )
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=devis_{item.devisID}.pdf"},
    )

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import io
from fpdf import FPDF
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
        message=f"Devis created for client {payload.clientID}",
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

    def _clean(text):
        if not text:
            return ""
        # FPDF core fonts only support latin-1. Replace unhandled chars to prevent 500 errors.
        return str(text).encode("latin-1", "replace").decode("latin-1")

    pdf = FPDF()
    pdf.add_page()

    # Header
    pdf.set_font("helvetica", "B", 20)
    pdf.set_text_color(79, 70, 229)  # Indigo-600
    pdf.cell(0, 10, "DEVIS", ln=True, align="R")
    pdf.set_font("helvetica", "", 10)
    pdf.set_text_color(107, 114, 128)  # Gray-500
    pdf.cell(0, 5, _clean(f"Référence: DEV-{item.devisID}"), ln=True, align="R")
    pdf.cell(0, 5, _clean(f"Date: {item.dateDevis.strftime('%d/%m/%Y')}"), ln=True, align="R")
    if item.validUntil:
        pdf.cell(0, 5, _clean(f"Valide jusqu'au: {item.validUntil.strftime('%d/%m/%Y')}"), ln=True, align="R")
    pdf.ln(10)

    # Client Info
    pdf.set_font("helvetica", "B", 12)
    pdf.set_text_color(31, 41, 55)  # Gray-800
    pdf.cell(0, 7, "Client:", ln=True)
    pdf.set_font("helvetica", "", 12)
    pdf.cell(0, 7, _clean(item.client.nom), ln=True)
    if item.client.email:
        pdf.cell(0, 7, _clean(item.client.email), ln=True)
    pdf.ln(10)

    # Title
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, _clean(item.notes or "Détail des prestations"), ln=True)
    pdf.ln(5)

    # Table Header
    pdf.set_fill_color(243, 244, 246)  # Gray-100
    pdf.set_font("helvetica", "B", 10)
    pdf.cell(110, 10, "Description", border=1, fill=True)
    pdf.cell(20, 10, "Qté", border=1, fill=True, align="C")
    pdf.cell(30, 10, "Prix Unitaire", border=1, fill=True, align="R")
    pdf.cell(30, 10, "Total", border=1, fill=True, align="R")
    pdf.ln()

    # Table Body
    pdf.set_font("helvetica", "", 10)
    devise = item.client.devise or "DT"
    for line in item.items:
        # Check if we need a new page before drawing the row
        if pdf.get_y() > 250:
            pdf.add_page()
            # Redraw header if needed or just continue
        
        description = _clean(line.description)
        x = pdf.get_x()
        y = pdf.get_y()
        # Multi-cell for description
        pdf.multi_cell(110, 10, description, border=1)
        new_y = pdf.get_y()
        height = new_y - y
        
        # Draw remaining cells aligned with the height of the multi-cell
        pdf.set_xy(x + 110, y)
        pdf.cell(20, height, str(line.quantity), border=1, align="C")
        pdf.cell(30, height, f"{line.unitPrice:,.2f}", border=1, align="R")
        pdf.cell(30, height, f"{line.lineTotal:,.2f}", border=1, align="R")
        pdf.set_y(new_y)

    # Totals
    pdf.ln(5)
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(160, 10, "TOTAL HT", border=0, align="R")
    pdf.cell(30, 10, f"{item.totalAmount:,.2f} {devise}", border=0, align="R")

    pdf_bytes = pdf.output()
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=devis_{item.devisID}.pdf"},
    )

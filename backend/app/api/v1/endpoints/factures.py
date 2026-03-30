from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import io
from fpdf import FPDF
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


@router.get("/{facture_id}/pdf")
def export_facture_pdf(facture_id: int, db: Session = Depends(get_db)):
    item = db.get(Facture, facture_id)
    if not item:
        raise HTTPException(status_code=404, detail="Facture not found")

    pdf = FPDF()
    pdf.add_page()

    # Header
    pdf.set_font("helvetica", "B", 20)
    pdf.set_text_color(79, 70, 229)  # Indigo-600
    pdf.cell(0, 10, "FACTURE", ln=True, align="R")
    pdf.set_font("helvetica", "", 10)
    pdf.set_text_color(107, 114, 128)  # Gray-500
    pdf.cell(0, 5, f"Référence: FAC-{item.factureID}", ln=True, align="R")
    pdf.cell(0, 5, f"Date: {item.dateFacture.strftime('%d/%m/%Y')}", ln=True, align="R")
    if item.dueDate:
        pdf.cell(0, 5, f"Échéance: {item.dueDate.strftime('%d/%m/%Y')}", ln=True, align="R")
    pdf.ln(10)

    # Client Info
    pdf.set_font("helvetica", "B", 12)
    pdf.set_text_color(31, 41, 55)  # Gray-800
    pdf.cell(0, 7, "Client:", ln=True)
    pdf.set_font("helvetica", "", 12)
    pdf.cell(0, 7, item.client.nom, ln=True)
    if item.client.email:
        pdf.cell(0, 7, item.client.email, ln=True)
    pdf.set_font("helvetica", "B", 10)
    pdf.ln(5)
    status_label = "PAYÉE" if item.status in ["payee", "paid"] else "EN ATTENTE"
    pdf.cell(0, 7, f"Statut: {status_label}", ln=True)
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
        x = pdf.get_x()
        y = pdf.get_y()
        pdf.multi_cell(110, 10, line.description, border=1)
        new_y = pdf.get_y()
        pdf.set_xy(x + 110, y)
        height = new_y - y
        pdf.cell(20, height, str(line.quantity), border=1, align="C")
        pdf.cell(30, height, f"{line.unitPrice:,.2f}", border=1, align="R")
        pdf.cell(30, height, f"{line.lineTotal:,.2f}", border=1, align="R")
        pdf.ln()

    # Totals
    pdf.ln(5)
    pdf.set_font("helvetica", "", 10)
    pdf.cell(160, 7, "Total HT", border=0, align="R")
    pdf.cell(30, 7, f"{item.amountHT:,.2f} {devise}", border=0, align="R")
    pdf.ln()
    pdf.cell(160, 7, f"TVA ({item.taxRate}%)", border=0, align="R")
    tva = item.amountTTC - item.amountHT
    pdf.cell(30, 7, f"{tva:,.2f} {devise}", border=0, align="R")
    pdf.ln()
    pdf.set_font("helvetica", "B", 12)
    pdf.cell(160, 10, "TOTAL TTC", border=0, align="R")
    pdf.cell(30, 10, f"{item.amountTTC:,.2f} {devise}", border=0, align="R")

    pdf_bytes = pdf.output()
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=facture_{item.factureID}.pdf"},
    )

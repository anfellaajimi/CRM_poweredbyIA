from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
import io
from fpdf import FPDF
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
from app.db.session import get_db
from app.models.client import Client
from app.models.contrat import Contrat
from app.schemas.contrat import ContratCreate, ContratRead, ContratUpdate

router = APIRouter(prefix="/contrats", tags=["Contrats"])


def _compute_needs_renewal(date_fin: date | None, explicit: bool | None = None) -> bool:
    if explicit is not None:
        return explicit
    if not date_fin:
        return False
    return date_fin <= (date.today() + timedelta(days=30))


@router.get("", response_model=list[ContratRead])
def list_contrats(db: Session = Depends(get_db)):
    return db.query(Contrat).order_by(Contrat.contratID.desc()).all()


@router.get("/{contrat_id}", response_model=ContratRead)
def get_contrat(contrat_id: int, db: Session = Depends(get_db)):
    item = db.get(Contrat, contrat_id)
    if not item:
        raise HTTPException(status_code=404, detail="Contrat not found")
    return item


@router.post("", response_model=ContratRead, status_code=status.HTTP_201_CREATED)
def create_contrat(payload: ContratCreate, db: Session = Depends(get_db)):
    if not db.get(Client, payload.clientID):
        raise HTTPException(status_code=400, detail="Client not found")
    data = payload.model_dump()
    data["needsRenewal"] = _compute_needs_renewal(payload.dateFin, payload.needsRenewal)
    if not data.get("titre"):
        data["titre"] = payload.typeContrat
    item = Contrat(**data)
    db.add(item)
    log_activity(
        db,
        entity_type="contrat",
        entity_id=None,
        action="create",
        message=f"Contrat créé pour le client {payload.clientID}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{contrat_id}", response_model=ContratRead)
def update_contrat(contrat_id: int, payload: ContratUpdate, db: Session = Depends(get_db)):
    item = db.get(Contrat, contrat_id)
    if not item:
        raise HTTPException(status_code=404, detail="Contrat not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    item.needsRenewal = _compute_needs_renewal(item.dateFin, payload.needsRenewal)
    if not item.titre:
        item.titre = item.typeContrat
    log_activity(
        db,
        entity_type="contrat",
        entity_id=item.contratID,
        action="update",
        message=f"Contrat {item.contratID} updated",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{contrat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contrat(contrat_id: int, db: Session = Depends(get_db)):
    item = db.get(Contrat, contrat_id)
    if not item:
        raise HTTPException(status_code=404, detail="Contrat not found")
    log_activity(
        db,
        entity_type="contrat",
        entity_id=item.contratID,
        action="delete",
        message=f"Contrat {item.contratID} deleted",
    )
    db.delete(item)
    db.commit()
    return None


@router.get("/{contrat_id}/pdf")
def export_contrat_pdf(contrat_id: int, db: Session = Depends(get_db)):
    item = db.get(Contrat, contrat_id)
    if not item:
        raise HTTPException(status_code=404, detail="Contrat not found")

    def _clean(text):
        if not text:
            return ""
        return str(text).encode("latin-1", "replace").decode("latin-1")

    pdf = FPDF()
    pdf.add_page()

    # Header
    pdf.set_font("helvetica", "B", 20)
    pdf.set_text_color(79, 70, 229)  # Indigo-600
    pdf.cell(0, 10, "CONTRAT", ln=True, align="R")
    pdf.set_font("helvetica", "", 10)
    pdf.set_text_color(107, 114, 128)  # Gray-500
    pdf.cell(0, 5, _clean(f"Référence: CTR-{item.contratID}"), ln=True, align="R")
    pdf.cell(0, 5, _clean(f"Type: {item.typeContrat}"), ln=True, align="R")
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

    # Contract Details
    pdf.set_font("helvetica", "B", 14)
    pdf.cell(0, 10, _clean(item.titre or item.typeContrat), ln=True)
    pdf.ln(5)

    details = [
        ("Valeur du contrat", _clean(f"{item.montant:,.2f} {item.client.devise or 'DT'}")),
        ("Date de début", _clean(item.dateDebut.strftime('%d/%m/%Y') if item.dateDebut else "—")),
        ("Date de fin", _clean(item.dateFin.strftime('%d/%m/%Y') if item.dateFin else "—")),
        ("Statut", _clean(item.status.upper())),
    ]

    for label, value in details:
        pdf.set_font("helvetica", "B", 10)
        pdf.cell(40, 7, f"{label}:", ln=False)
        pdf.set_font("helvetica", "", 10)
        pdf.cell(0, 7, value, ln=True)

    pdf.ln(10)

    # Sections
    sections = [
        ("Objet", item.objet),
        ("Obligations", item.obligations),
        ("Responsabilités", item.responsabilites),
        ("Conditions", item.conditions),
    ]

    for label, content in sections:
        if content:
            if pdf.get_y() > 250:
                pdf.add_page()
            pdf.set_font("helvetica", "B", 11)
            pdf.cell(0, 10, _clean(label), ln=True)
            pdf.set_font("helvetica", "", 10)
            pdf.multi_cell(0, 7, _clean(content))
            pdf.ln(5)

    # Signature Section
    pdf.ln(15)
    if pdf.get_y() > 200:  # Check if near end of page
        pdf.add_page()
    
    pdf.set_draw_color(229, 231, 235)  # gray-200
    pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 190, pdf.get_y())
    pdf.ln(10)
    
    pdf.set_font("helvetica", "B", 12)
    pdf.set_text_color(31, 41, 55)  # Gray-800
    pdf.cell(0, 10, "SIGNATURES ET APPROBATION", ln=True, align="C")
    pdf.ln(10)
    
    y_before = pdf.get_y()
    
    # Client Side
    pdf.set_font("helvetica", "B", 10)
    pdf.set_text_color(107, 114, 128)  # Gray-500
    pdf.cell(95, 7, "LE CLIENT", ln=False)
    # Provider Side
    pdf.cell(95, 7, "LE PRESTATAIRE", ln=True)
    
    pdf.set_font("helvetica", "", 10)
    pdf.set_text_color(31, 41, 55)
    pdf.cell(95, 7, _clean(item.client.nom), ln=False)
    pdf.cell(95, 7, "CRM AI Pro", ln=True)
    
    pdf.ln(5)
    # Signature boxes (drawn as rectangles)
    pdf.set_draw_color(209, 213, 219)  # gray-300
    current_y = pdf.get_y()
    pdf.rect(pdf.get_x(), current_y, 80, 40)
    pdf.rect(pdf.get_x() + 100, current_y, 80, 40)
    
    pdf.set_font("helvetica", "I", 8)
    pdf.set_text_color(156, 163, 175)  # Gray-400
    pdf.set_y(current_y + 42)
    pdf.cell(95, 5, "Date et mention 'Lu et approuvé'", ln=False)
    pdf.cell(95, 5, "Date et cachet de l'entreprise", ln=True)

    pdf_bytes = pdf.output()
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=contrat_{item.contratID}.pdf"},
    )

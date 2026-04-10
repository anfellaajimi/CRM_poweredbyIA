from datetime import date, datetime
from uuid import uuid4

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
from app.core.config import settings
from app.db.session import get_db
from app.models.declaration_cnss import DeclarationCNSS
from app.models.utilisateur import Utilisateur
from app.schemas.declaration_cnss import DeclarationCNSSRead, DeclarationCNSSListRead

router = APIRouter(prefix="/utilisateurs", tags=["Utilisateurs"])

MAX_PDF_SIZE = 10 * 1024 * 1024

def _require_user(db: Session, user_id: int) -> Utilisateur:
    user = db.get(Utilisateur, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur not found")
    return user

def _configure_cloudinary() -> None:
    if not settings.CLOUDINARY_CLOUD_NAME or not settings.CLOUDINARY_API_KEY or not settings.CLOUDINARY_API_SECRET:
        raise HTTPException(status_code=500, detail="Cloudinary credentials are not configured")
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )

def _upload_pdf_to_cloudinary(file_bytes: bytes, *, front_id: str) -> tuple[str, str]:
    _configure_cloudinary()
    upload_result = cloudinary.uploader.upload(
        file_bytes,
        resource_type="image",
        folder=settings.CLOUDINARY_FOLDER_USER_CONTRACTS, # Reuse folder or add new one to settings
        public_id=f"cnss_{front_id}_{uuid4().hex}.pdf",
        overwrite=False,
    )
    pdf_url = upload_result.get("secure_url")
    public_id = upload_result.get("public_id")
    if not pdf_url or not public_id:
        raise HTTPException(status_code=500, detail="Cloudinary upload failed")
    return str(pdf_url), str(public_id)

def _destroy_cloudinary_file(public_id: str | None) -> None:
    if not public_id:
        return
    try:
        _configure_cloudinary()
        cloudinary.uploader.destroy(public_id, resource_type="image")
    except Exception:
        return

async def _read_pdf_or_raise(file: UploadFile) -> tuple[bytes, str, int]:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="PDF file is required")
    if len(content) > MAX_PDF_SIZE:
        raise HTTPException(status_code=400, detail="PDF size must be <= 10MB")
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Only valid PDF files are accepted")
    return content, "application/pdf", len(content)

@router.get("/{user_id}/cnss-declarations", response_model=DeclarationCNSSListRead)
def list_cnss_declarations(user_id: int, db: Session = Depends(get_db)):
    _require_user(db, user_id)
    all_declarations = (
        db.query(DeclarationCNSS)
        .filter(DeclarationCNSS.userID == user_id)
        .order_by(DeclarationCNSS.declarationDate.desc(), DeclarationCNSS.id.desc())
        .all()
    )
    return {"all": all_declarations}

@router.post("/{user_id}/cnss-declarations", response_model=DeclarationCNSSRead, status_code=status.HTTP_201_CREATED)
async def create_cnss_declaration(
    user_id: int,
    front_id: str = Form(..., alias="frontId"),
    name: str = Form(...),
    description: str | None = Form(None),
    declarationDate_val: date = Form(..., alias="declarationDate"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    _require_user(db, user_id)
    front_id_clean = front_id.strip()
    if db.query(DeclarationCNSS).filter(DeclarationCNSS.frontId == front_id_clean).first():
        raise HTTPException(status_code=409, detail="frontId already exists")

    file_bytes, mime_type, file_size = await _read_pdf_or_raise(file)
    pdf_url, pdf_public_id = _upload_pdf_to_cloudinary(file_bytes, front_id=front_id_clean)

    item = DeclarationCNSS(
        userID=user_id,
        frontId=front_id_clean,
        name=name.strip(),
        description=(description or "").strip() or None,
        declarationDate=declarationDate_val,
        pdfUrl=pdf_url,
        pdfPublicId=pdf_public_id,
        mimeType=mime_type,
        fileSize=file_size,
    )
    db.add(item)
    log_activity(
        db,
        entity_type="cnss_declaration",
        entity_id=None,
        action="create",
        message=f"CNSS Declaration {front_id_clean} created for user {user_id}",
    )
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{user_id}/cnss-declarations/{decl_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cnss_declaration(user_id: int, decl_id: int, db: Session = Depends(get_db)):
    _require_user(db, user_id)
    item = db.get(DeclarationCNSS, decl_id)
    if not item or item.userID != user_id:
        raise HTTPException(status_code=404, detail="Declaration not found")
    
    _destroy_cloudinary_file(item.pdfPublicId)
    db.delete(item)
    log_activity(
        db,
        entity_type="cnss_declaration",
        entity_id=item.id,
        action="delete",
        message=f"CNSS Declaration {item.frontId} deleted",
    )
    db.commit()
    return None

from datetime import date, datetime
from uuid import uuid4

import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.v1.endpoints._activity import log_activity
from app.core.config import settings
from app.db.session import get_db
from app.models.user_contract import UserContract
from app.models.utilisateur import Utilisateur
from app.schemas.user_contract import UserContractRead, UserContractsGroupedRead

router = APIRouter(prefix="/utilisateurs", tags=["Utilisateurs"])

MAX_PDF_SIZE = 10 * 1024 * 1024
ALLOWED_STATUS = {"active", "inactive"}


def _require_user(db: Session, user_id: int) -> Utilisateur:
    user = db.get(Utilisateur, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur not found")
    return user


def _validate_status(status_value: str) -> str:
    status_normalized = status_value.strip().lower()
    if status_normalized not in ALLOWED_STATUS:
        raise HTTPException(status_code=400, detail="status must be 'active' or 'inactive'")
    return status_normalized


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
        folder=settings.CLOUDINARY_FOLDER_USER_CONTRACTS,
        public_id=f"{front_id}_{uuid4().hex}.pdf",
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
        # We keep the DB operation successful even if old file cleanup fails.
        return


def _deactivate_existing_active_contract(db: Session, user_id: int, except_id: int | None = None) -> None:
    query = db.query(UserContract).filter(UserContract.userID == user_id, UserContract.status == "active")
    if except_id is not None:
        query = query.filter(UserContract.id != except_id)
    existing_active = query.all()
    if not existing_active:
        return
    now = datetime.utcnow()
    for contract in existing_active:
        contract.status = "inactive"
        contract.archivedAt = now
        contract.updatedAt = now


async def _read_pdf_or_raise(file: UploadFile) -> tuple[bytes, str, int]:
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="PDF file is required")
    if len(content) > MAX_PDF_SIZE:
        raise HTTPException(status_code=400, detail="PDF size must be <= 10MB")
    if not content.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="Only valid PDF files are accepted")

    mime_type = (file.content_type or "").lower()
    if mime_type and mime_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    return content, "application/pdf", len(content)


@router.get("/{user_id}/contracts", response_model=UserContractsGroupedRead)
def list_user_contracts(user_id: int, db: Session = Depends(get_db)):
    _require_user(db, user_id)
    all_contracts = (
        db.query(UserContract)
        .filter(UserContract.userID == user_id)
        .order_by(UserContract.createdAt.desc(), UserContract.id.desc())
        .all()
    )
    active = next((item for item in all_contracts if item.status == "active"), None)
    history = [item for item in all_contracts if item.status != "active"]
    return {"active": active, "history": history, "all": all_contracts}


@router.get("/{user_id}/contracts/{contract_id}", response_model=UserContractRead)
def get_user_contract(user_id: int, contract_id: int, db: Session = Depends(get_db)):
    _require_user(db, user_id)
    item = db.get(UserContract, contract_id)
    if not item or item.userID != user_id:
        raise HTTPException(status_code=404, detail="User contract not found")
    return item


@router.post("/{user_id}/contracts", response_model=UserContractRead, status_code=status.HTTP_201_CREATED)
async def create_user_contract(
    user_id: int,
    front_id: str = Form(..., alias="frontId"),
    name: str = Form(...),
    contract_type: str = Form(..., alias="type"),
    description: str | None = Form(None),
    status_value: str = Form("active", alias="status"),
    startDate: date | None = Form(None),
    endDate: date | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    _require_user(db, user_id)
    front_id_clean = front_id.strip()
    if not front_id_clean:
        raise HTTPException(status_code=400, detail="frontId is required")
    if db.query(UserContract).filter(UserContract.frontId == front_id_clean).first():
        raise HTTPException(status_code=409, detail="frontId already exists")

    normalized_status = _validate_status(status_value)
    file_bytes, mime_type, file_size = await _read_pdf_or_raise(file)
    pdf_url, pdf_public_id = _upload_pdf_to_cloudinary(file_bytes, front_id=front_id_clean)

    now = datetime.utcnow()
    if normalized_status == "active":
        _deactivate_existing_active_contract(db, user_id)

    item = UserContract(
        userID=user_id,
        frontId=front_id_clean,
        name=name.strip(),
        type=contract_type.strip(),
        description=(description or "").strip() or None,
        status=normalized_status,
        pdfUrl=pdf_url,
        pdfPublicId=pdf_public_id,
        mimeType=mime_type,
        fileSize=file_size,
        activatedAt=now if normalized_status == "active" else None,
        archivedAt=now if normalized_status == "inactive" else None,
        startDate=startDate,
        endDate=endDate,
    )
    db.add(item)
    log_activity(
        db,
        entity_type="user_contract",
        entity_id=None,
        action="create",
        message=f"User contract {front_id_clean} created for user {user_id}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.put("/{user_id}/contracts/{contract_id}", response_model=UserContractRead)
async def update_user_contract(
    user_id: int,
    contract_id: int,
    front_id: str | None = Form(None, alias="frontId"),
    name: str | None = Form(None),
    contract_type: str | None = Form(None, alias="type"),
    description: str | None = Form(None),
    status_value: str | None = Form(None, alias="status"),
    startDate: date | None = Form(None),
    endDate: date | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    _require_user(db, user_id)
    item = db.get(UserContract, contract_id)
    if not item or item.userID != user_id:
        raise HTTPException(status_code=404, detail="User contract not found")

    now = datetime.utcnow()
    if front_id is not None:
        front_id_clean = front_id.strip()
        if not front_id_clean:
            raise HTTPException(status_code=400, detail="frontId cannot be empty")
        duplicate = (
            db.query(UserContract)
            .filter(UserContract.frontId == front_id_clean, UserContract.id != contract_id)
            .first()
        )
        if duplicate:
            raise HTTPException(status_code=409, detail="frontId already exists")
        item.frontId = front_id_clean

    if name is not None:
        name_clean = name.strip()
        if not name_clean:
            raise HTTPException(status_code=400, detail="name cannot be empty")
        item.name = name_clean
    if contract_type is not None:
        type_clean = contract_type.strip()
        if not type_clean:
            raise HTTPException(status_code=400, detail="type cannot be empty")
        item.type = type_clean
    if description is not None:
        item.description = description.strip() or None

    if status_value is not None:
        normalized_status = _validate_status(status_value)
        if normalized_status == "active":
            _deactivate_existing_active_contract(db, user_id, except_id=contract_id)
            item.activatedAt = now
            item.archivedAt = None
        elif item.status == "active":
            item.archivedAt = now
        item.status = normalized_status

    if startDate is not None:
        item.startDate = startDate
    if endDate is not None:
        item.endDate = endDate

    if file is not None:
        file_bytes, mime_type, file_size = await _read_pdf_or_raise(file)
        new_pdf_url, new_public_id = _upload_pdf_to_cloudinary(file_bytes, front_id=item.frontId)
        previous_public_id = item.pdfPublicId
        item.pdfUrl = new_pdf_url
        item.pdfPublicId = new_public_id
        item.mimeType = mime_type
        item.fileSize = file_size
        _destroy_cloudinary_file(previous_public_id)

    item.updatedAt = now
    log_activity(
        db,
        entity_type="user_contract",
        entity_id=item.id,
        action="update",
        message=f"User contract {item.frontId} updated",
    )
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{user_id}/contracts/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_contract(user_id: int, contract_id: int, db: Session = Depends(get_db)):
    _require_user(db, user_id)
    item = db.get(UserContract, contract_id)
    if not item or item.userID != user_id:
        raise HTTPException(status_code=404, detail="User contract not found")
    
    _destroy_cloudinary_file(item.pdfPublicId)
    db.delete(item)
    log_activity(
        db,
        entity_type="user_contract",
        entity_id=item.id,
        action="delete",
        message=f"User contract {item.frontId} deleted",
    )
    db.commit()
    return None

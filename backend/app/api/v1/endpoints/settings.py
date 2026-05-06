import cloudinary.uploader
from typing import Any
from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user as get_current_active_user
from app.models.app_settings import AppSettings
from app.schemas.app_settings import AppSettings as AppSettingsSchema, AppSettingsUpdate
from app.core.config import settings as app_settings

import cloudinary

cloudinary.config(
    cloud_name=app_settings.CLOUDINARY_CLOUD_NAME,
    api_key=app_settings.CLOUDINARY_API_KEY,
    api_secret=app_settings.CLOUDINARY_API_SECRET,
    secure=True,
)

router = APIRouter()

@router.get("/", response_model=AppSettingsSchema)
def read_settings(
    db: Session = Depends(get_db),
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Get organization settings. Creates default if none exists.
    """
    settings = db.query(AppSettings).first()
    if not settings:
        settings = AppSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/", response_model=AppSettingsSchema)
def update_settings(
    *,
    db: Session = Depends(get_db),
    settings_in: AppSettingsUpdate,
    current_user: Any = Depends(get_current_active_user),

) -> Any:
    """
    Update organization settings.
    """
    settings = db.query(AppSettings).first()
    if not settings:
        settings = AppSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    update_data = settings_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings

@router.post("/upload-image")
async def upload_settings_image(
    file: UploadFile = File(...),
    current_user: Any = Depends(get_current_active_user),
) -> Any:
    """
    Upload an image for organization settings (logo or stamp) to Cloudinary.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        file_bytes = await file.read()
        upload_result = cloudinary.uploader.upload(
            file_bytes,
            folder="crm-professional/settings",
            resource_type="image"
        )
        return {"url": upload_result.get("secure_url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

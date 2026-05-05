from typing import Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.v1.endpoints.auth import get_current_user as get_current_active_user
from app.models.app_settings import AppSettings
from app.schemas.app_settings import AppSettings as AppSettingsSchema, AppSettingsUpdate

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

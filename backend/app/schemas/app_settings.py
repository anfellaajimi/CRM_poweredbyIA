from pydantic import BaseModel
from typing import Optional

class AppSettingsBase(BaseModel):
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    company_tax_id: Optional[str] = None
    company_vat_number: Optional[str] = None
    company_phone: Optional[str] = None
    company_email: Optional[str] = None
    company_reference: Optional[str] = None

    logo_url: Optional[str] = None
    stamp_url: Optional[str] = None
    default_tax_rate: Optional[float] = 19.0
    default_validity_days: Optional[int] = 30
    document_notes: Optional[str] = None

    ai_provider: Optional[str] = "openai"
    ai_api_key: Optional[str] = None
    ai_model: Optional[str] = "gpt-4"

    notifications_enabled: Optional[bool] = True
    notifications_email_enabled: Optional[bool] = False
    notifications_push_enabled: Optional[bool] = True
    notifications_daily_digest_enabled: Optional[bool] = False
    notifications_email_recipients: Optional[str] = None

    appearance_theme: Optional[str] = "light"
    appearance_primary_color: Optional[str] = "#6366f1"

    subscription_plan: Optional[str] = "Enterprise AI"
    subscription_status: Optional[str] = "Actif"
    payment_method_last4: Optional[str] = "4242"
    payment_method_expiry: Optional[str] = "12/2027"

class AppSettingsCreate(AppSettingsBase):
    pass

class AppSettingsUpdate(AppSettingsBase):
    pass

class AppSettingsInDBBase(AppSettingsBase):
    id: int

    class Config:
        from_attributes = True

class AppSettings(AppSettingsInDBBase):
    pass

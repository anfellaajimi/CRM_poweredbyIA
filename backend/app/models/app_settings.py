from sqlalchemy import Boolean, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base

class AppSettings(Base):
    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    # General settings
    company_name: Mapped[str | None] = mapped_column(String(255))
    company_address: Mapped[str | None] = mapped_column(Text)
    company_tax_id: Mapped[str | None] = mapped_column(String(100)) # Matricule fiscal
    company_vat_number: Mapped[str | None] = mapped_column(String(100)) # Code TVA
    company_phone: Mapped[str | None] = mapped_column(String(50))
    company_email: Mapped[str | None] = mapped_column(String(150))
    company_reference: Mapped[str | None] = mapped_column(String(100))

    # Document Settings (Devis & Factures)
    logo_url: Mapped[str | None] = mapped_column(String(500))
    stamp_url: Mapped[str | None] = mapped_column(String(500))
    default_tax_rate: Mapped[float | None] = mapped_column(Numeric(5, 2), default=19.0)
    default_validity_days: Mapped[int | None] = mapped_column(Integer, default=30)
    document_notes: Mapped[str | None] = mapped_column(Text)

    # IA Settings
    ai_provider: Mapped[str | None] = mapped_column(String(50), default="groq")
    ai_api_key: Mapped[str | None] = mapped_column(String(255))
    ai_model: Mapped[str | None] = mapped_column(String(100), default="llama-3.1-8b-instant")

    # Notification Settings
    notifications_enabled: Mapped[bool | None] = mapped_column(Boolean, default=True)
    notifications_email_enabled: Mapped[bool | None] = mapped_column(Boolean, default=False)
    notifications_push_enabled: Mapped[bool | None] = mapped_column(Boolean, default=True)
    notifications_daily_digest_enabled: Mapped[bool | None] = mapped_column(Boolean, default=False)
    notifications_email_recipients: Mapped[str | None] = mapped_column(Text)

    # Appearance Settings
    appearance_theme: Mapped[str | None] = mapped_column(String(20), default="light")
    appearance_primary_color: Mapped[str | None] = mapped_column(String(20), default="#6366f1")

    # Subscription & Billing Settings
    subscription_plan: Mapped[str | None] = mapped_column(String(100), default="Enterprise AI")
    subscription_status: Mapped[str | None] = mapped_column(String(50), default="Actif")
    payment_method_last4: Mapped[str | None] = mapped_column(String(10), default="4242")
    payment_method_expiry: Mapped[str | None] = mapped_column(String(20), default="12/2027")

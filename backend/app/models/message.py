from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    expediteurID: Mapped[int] = mapped_column(
        ForeignKey("utilisateurs.userID", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    destinataireID: Mapped[int] = mapped_column(
        ForeignKey("utilisateurs.userID", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    contenu: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[str] = mapped_column(String(20), default="text", nullable=False, index=True)
    mediaUrl: Mapped[str | None] = mapped_column(Text, nullable=True)
    mediaMimeType: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mediaDurationSec: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lu: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False, index=True
    )

    expediteur = relationship("Utilisateur", foreign_keys=[expediteurID])
    destinataire = relationship("Utilisateur", foreign_keys=[destinataireID])

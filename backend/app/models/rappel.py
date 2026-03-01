from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Rappel(Base):
    __tablename__ = "rappels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clientID: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    titre: Mapped[str] = mapped_column(String(255), nullable=False)
    typeRappel: Mapped[str | None] = mapped_column(String(50))
    dateRappel: Mapped[datetime | None] = mapped_column(DateTime)
    message: Mapped[str | None] = mapped_column(Text)
    statut: Mapped[str] = mapped_column(String(50), default="en_attente", nullable=False, index=True)
    priorite: Mapped[str] = mapped_column(String(50), default="moyenne", nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    client = relationship("Client", back_populates="rappels")

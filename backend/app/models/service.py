from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    projetID: Mapped[int] = mapped_column(ForeignKey("projets.id", ondelete="CASCADE"), nullable=False, index=True)
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str | None] = mapped_column(String(50))
    prix: Mapped[float | None] = mapped_column(Numeric(10, 2))
    dateRenouvellement: Mapped[date | None] = mapped_column(Date)
    statut: Mapped[str] = mapped_column(String(50), default="actif", nullable=False, index=True)
    url: Mapped[str | None] = mapped_column(Text)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    projet = relationship("Projet", back_populates="services")
    acces = relationship("Acces", back_populates="service")
    aiMonitoring = relationship("AIMonitoring", back_populates="service", uselist=False, cascade="all, delete-orphan")

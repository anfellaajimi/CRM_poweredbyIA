from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class CahierDeCharge(Base):
    __tablename__ = "cahier_de_charge"

    cahierID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    projetID: Mapped[int] = mapped_column(ForeignKey("projets.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    objet: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    dateCreation: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    dateValidation: Mapped[datetime | None] = mapped_column(DateTime)
    fileUrl: Mapped[str | None] = mapped_column(String(500))
    version: Mapped[str] = mapped_column(String(30), default="1.0", nullable=False)
    objectif: Mapped[str | None] = mapped_column(Text)
    perimetre: Mapped[str | None] = mapped_column(Text)
    fonctionnalites: Mapped[str | None] = mapped_column(Text)
    contraintes: Mapped[str | None] = mapped_column(Text)
    delais: Mapped[str | None] = mapped_column(Text)
    budgetTexte: Mapped[str | None] = mapped_column(Text)
    userStories: Mapped[str | None] = mapped_column(Text)
    reglesMetier: Mapped[str | None] = mapped_column(Text)
    documentsReference: Mapped[str | None] = mapped_column(Text)

    projet = relationship("Projet", back_populates="cahierDeCharge")

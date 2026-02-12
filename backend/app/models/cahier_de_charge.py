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

    projet = relationship("Projet", back_populates="cahierDeCharge")

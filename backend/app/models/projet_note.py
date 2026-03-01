from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ProjetNote(Base):
    __tablename__ = "projet_notes"

    noteID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    projetID: Mapped[int] = mapped_column(ForeignKey("projets.id", ondelete="CASCADE"), nullable=False, index=True)
    contenu: Mapped[str] = mapped_column(Text, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    createdBy: Mapped[int | None] = mapped_column(ForeignKey("utilisateurs.userID", ondelete="SET NULL"), index=True)

    projet = relationship("Projet", back_populates="notes")
    auteur = relationship("Utilisateur")

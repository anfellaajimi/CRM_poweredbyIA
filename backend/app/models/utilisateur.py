from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Utilisateur(Base):
    __tablename__ = "utilisateurs"

    userID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    nom: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    motDePasse: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="developpeur", nullable=False)
    actif: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    dateCreation: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    projets = relationship("Projet", secondary="projet_utilisateurs", back_populates="utilisateurs")

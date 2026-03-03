from datetime import date, datetime

from sqlalchemy import Date, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    typeClient: Mapped[str] = mapped_column(String(50), default="moral", nullable=False)
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    tel: Mapped[str | None] = mapped_column(String(50))
    adresse: Mapped[str | None] = mapped_column(Text)
    prenom: Mapped[str | None] = mapped_column(String(255))
    dateNaissance: Mapped[date | None] = mapped_column(Date)
    cin: Mapped[str | None] = mapped_column(String(100))
    raisonSociale: Mapped[str | None] = mapped_column(String(255))
    matriculeFiscale: Mapped[str | None] = mapped_column(String(255))
    secteurActivite: Mapped[str | None] = mapped_column(String(255))
    entreprise: Mapped[str | None] = mapped_column(String(255))
    avatarUrl: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(50), default="actif", nullable=False)
    devise: Mapped[str] = mapped_column(String(10), default="TND", nullable=False)
    dateCreation: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    projets = relationship("Projet", back_populates="client", cascade="all, delete-orphan")
    rappels = relationship("Rappel", back_populates="client", cascade="all, delete-orphan")
    devis = relationship("Devis", back_populates="client", cascade="all, delete-orphan")
    factures = relationship("Facture", back_populates="client", cascade="all, delete-orphan")
    contrats = relationship("Contrat", back_populates="client", cascade="all, delete-orphan")

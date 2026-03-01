from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Projet(Base):
    __tablename__ = "projets"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clientID: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    nomProjet: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="en_cours", nullable=False, index=True)
    priorite: Mapped[str] = mapped_column(String(50), default="moyenne", nullable=False)
    budget: Mapped[float | None] = mapped_column(Numeric(12, 2))
    depense: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    progression: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    dateDebut: Mapped[date | None] = mapped_column(Date)
    dateFin: Mapped[date | None] = mapped_column(Date)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    dateMaj: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    client = relationship("Client", back_populates="projets")
    ressources = relationship("Ressource", back_populates="projet", cascade="all, delete-orphan")
    services = relationship("Service", back_populates="projet", cascade="all, delete-orphan")
    acces = relationship("Acces", back_populates="projet")
    utilisateurs = relationship("Utilisateur", secondary="projet_utilisateurs", back_populates="projets")
    devisPrincipaux = relationship("Devis", back_populates="projet")
    devis = relationship("Devis", secondary="devis_projets", back_populates="projets")
    factures = relationship("Facture", secondary="facture_projets", back_populates="projets")
    contrats = relationship("Contrat", back_populates="projet")
    cahierDeCharge = relationship("CahierDeCharge", back_populates="projet", uselist=False, cascade="all, delete-orphan")
    notes = relationship("ProjetNote", back_populates="projet", cascade="all, delete-orphan")
    files = relationship("ProjetFile", back_populates="projet", cascade="all, delete-orphan")

    @property
    def clientNom(self) -> str | None:
        return self.client.nom if self.client else None

    @property
    def assignedUsers(self) -> list[str]:
        return [user.nom for user in self.utilisateurs]

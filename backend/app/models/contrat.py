from datetime import date

from sqlalchemy import Boolean, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Contrat(Base):
    __tablename__ = "contrats"

    contratID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clientID: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    projetID: Mapped[int | None] = mapped_column(ForeignKey("projets.id", ondelete="SET NULL"), index=True)
    titre: Mapped[str | None] = mapped_column(String(255))
    objet: Mapped[str | None] = mapped_column(Text)
    obligations: Mapped[str | None] = mapped_column(Text)
    responsabilites: Mapped[str | None] = mapped_column(Text)
    dateDebut: Mapped[date | None] = mapped_column(Date)
    dateFin: Mapped[date | None] = mapped_column(Date)
    dateRenouvellement: Mapped[date | None] = mapped_column(Date, index=True)
    needsRenewal: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False, index=True)
    typeContrat: Mapped[str] = mapped_column(String(100), nullable=False)
    montant: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    conditions: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(50), default="actif", nullable=False, index=True)

    client = relationship("Client", back_populates="contrats")
    projet = relationship("Projet", back_populates="contrats")

    @property
    def clientNom(self) -> str | None:
        return self.client.nom if self.client else None

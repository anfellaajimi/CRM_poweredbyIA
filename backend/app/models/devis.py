from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Devis(Base):
    __tablename__ = "devis"

    devisID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clientID: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    projetID: Mapped[int | None] = mapped_column(ForeignKey("projets.id", ondelete="SET NULL"), index=True)
    dateDevis: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    validUntil: Mapped[datetime | None] = mapped_column(DateTime)
    totalAmount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="draft", nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text)

    client = relationship("Client", back_populates="devis")
    projet = relationship("Projet", back_populates="devisPrincipaux")
    projets = relationship("Projet", secondary="devis_projets", back_populates="devis")
    factures = relationship("Facture", back_populates="devis")
    items = relationship("DevisItem", back_populates="devis", cascade="all, delete-orphan")

    @property
    def clientNom(self) -> str | None:
        return self.client.nom if self.client else None

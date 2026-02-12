from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Facture(Base):
    __tablename__ = "factures"

    factureID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    clientID: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    devisID: Mapped[int | None] = mapped_column(ForeignKey("devis.devisID", ondelete="SET NULL"), index=True)
    dateFacture: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    dueDate: Mapped[datetime | None] = mapped_column(DateTime)
    amountHT: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    amountTTC: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="en_attente", nullable=False, index=True)
    taxRate: Mapped[float] = mapped_column(Numeric(5, 2), default=19.0, nullable=False)
    paymentDate: Mapped[datetime | None] = mapped_column(DateTime)

    client = relationship("Client", back_populates="factures")
    devis = relationship("Devis", back_populates="factures")
    projets = relationship("Projet", secondary="facture_projets", back_populates="factures")

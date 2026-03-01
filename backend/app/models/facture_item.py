from sqlalchemy import ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class FactureItem(Base):
    __tablename__ = "facture_items"

    itemID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    factureID: Mapped[int] = mapped_column(ForeignKey("factures.factureID", ondelete="CASCADE"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    quantity: Mapped[float] = mapped_column(Numeric(10, 2), default=1, nullable=False)
    unitPrice: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)
    lineTotal: Mapped[float] = mapped_column(Numeric(12, 2), default=0, nullable=False)

    facture = relationship("Facture", back_populates="items")

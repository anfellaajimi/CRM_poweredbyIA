from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Acces(Base):
    __tablename__ = "acces"

    accesID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    projetID: Mapped[int | None] = mapped_column(ForeignKey("projets.id", ondelete="SET NULL"), index=True)
    serviceID: Mapped[int | None] = mapped_column(ForeignKey("services.id", ondelete="SET NULL"), index=True)
    login: Mapped[str] = mapped_column(String(200), nullable=False)
    motDePasse: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(String(255))
    note: Mapped[str | None] = mapped_column(Text)

    projet = relationship("Projet", back_populates="acces")
    service = relationship("Service", back_populates="acces")

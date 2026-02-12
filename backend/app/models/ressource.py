from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class Ressource(Base):
    __tablename__ = "ressources"

    ressourceID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    projetID: Mapped[int] = mapped_column(ForeignKey("projets.id", ondelete="CASCADE"), nullable=False, index=True)
    nom: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[str | None] = mapped_column(String(100))
    url: Mapped[str | None] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(Text)

    projet = relationship("Projet", back_populates="ressources")

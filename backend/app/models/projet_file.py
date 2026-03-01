from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ProjetFile(Base):
    __tablename__ = "projet_files"

    fileID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    projetID: Mapped[int] = mapped_column(ForeignKey("projets.id", ondelete="CASCADE"), nullable=False, index=True)
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    mimeType: Mapped[str | None] = mapped_column(String(255))
    sizeBytes: Mapped[int] = mapped_column(Integer, nullable=False)
    storagePath: Mapped[str] = mapped_column(String(1000), nullable=False)
    uploadedAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    uploadedBy: Mapped[int | None] = mapped_column(ForeignKey("utilisateurs.userID", ondelete="SET NULL"), index=True)

    projet = relationship("Projet", back_populates="files")
    uploader = relationship("Utilisateur")

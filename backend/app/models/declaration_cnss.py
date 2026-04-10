from datetime import date, datetime
from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base

class DeclarationCNSS(Base):
    __tablename__ = "declaration_cnss"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    userID: Mapped[int] = mapped_column(
        ForeignKey("utilisateurs.userID", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    frontId: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    declarationDate: Mapped[date] = mapped_column(Date, nullable=False)
    
    # File handling
    pdfUrl: Mapped[str] = mapped_column(String(1000), nullable=False)
    pdfPublicId: Mapped[str] = mapped_column(String(300), nullable=False)
    mimeType: Mapped[str] = mapped_column(String(100), nullable=False, default="application/pdf")
    fileSize: Mapped[int] = mapped_column(Integer, nullable=False)
    
    createdAt: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    updatedAt: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    user = relationship("Utilisateur", back_populates="cnss_declarations")

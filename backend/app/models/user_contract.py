from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class UserContract(Base):
    __tablename__ = "user_contracts"
    __table_args__ = (
        CheckConstraint('"status" IN (\'active\', \'inactive\')', name="ck_user_contracts_status"),
        Index(
            "ux_user_contracts_one_active_per_user",
            "userID",
            unique=True,
            postgresql_where=text('"status" = \'active\''),
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    userID: Mapped[int] = mapped_column(
        ForeignKey("utilisateurs.userID", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    frontId: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    status: Mapped[bool] = mapped_column(String(20), nullable=False, default="inactive", index=True)
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
    activatedAt: Mapped[datetime | None] = mapped_column(DateTime)
    archivedAt: Mapped[datetime | None] = mapped_column(DateTime)
    startDate: Mapped[datetime | None] = mapped_column(DateTime)
    endDate: Mapped[datetime | None] = mapped_column(DateTime)

    user = relationship("Utilisateur", back_populates="contracts")

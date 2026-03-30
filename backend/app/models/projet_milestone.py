from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class ProjetMilestone(Base):
    __tablename__ = "projet_milestones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    projetID: Mapped[int] = mapped_column(
        ForeignKey("projets.id", ondelete="CASCADE"), nullable=False, index=True
    )

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    dueDate: Mapped[datetime | None] = mapped_column(DateTime, index=True)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False, index=True)
    completedAt: Mapped[datetime | None] = mapped_column(DateTime)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    projet = relationship("Projet", back_populates="milestones")
    rappels = relationship("Rappel", back_populates="milestone")


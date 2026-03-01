from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class ActivityEvent(Base):
    __tablename__ = "activity_events"

    eventID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    entityType: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    entityID: Mapped[int | None] = mapped_column(Integer, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    actor: Mapped[str | None] = mapped_column(String(255))

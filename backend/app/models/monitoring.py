from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base


class AIMonitoring(Base):
    __tablename__ = "ai_monitoring"

    monitoringID: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    serviceID: Mapped[int] = mapped_column(ForeignKey("services.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), default="unknown", nullable=False, index=True)
    uptime: Mapped[float] = mapped_column(Numeric(5, 2), default=100.0, nullable=False)
    responseTime: Mapped[float | None] = mapped_column(Numeric(8, 3))
    lastCheck: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    checks: Mapped[str | None] = mapped_column(Text)
    alerts: Mapped[str | None] = mapped_column(Text)

    service = relationship("Service", back_populates="aiMonitoring")

from datetime import datetime
import uuid
from sqlalchemy import Column, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base

class MLPrediction(Base):
    __tablename__ = "ml_predictions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prediction_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True) # revenue/projects/risk/perf
    predicted_value: Mapped[float] = mapped_column(Float, nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    period: Mapped[str | None] = mapped_column(String(50)) # e.g. "2024-06" or "all"
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    metadata_json: Mapped[dict | None] = mapped_column(JSON) # Additional details like project ID for risk, etc.

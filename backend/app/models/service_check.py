from datetime import datetime
import uuid
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class ServiceCheck(Base):
    __tablename__ = "service_checks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_name = Column(String(100), nullable=False, index=True) # frontend, backend, agent, database
    status = Column(String(50), nullable=False) # 200, offline, 4xx, 5xx
    response_time_ms = Column(Integer, nullable=True)
    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    error_message = Column(Text, nullable=True)

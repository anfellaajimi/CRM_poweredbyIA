from datetime import datetime

from pydantic import BaseModel


class AIMonitoringBase(BaseModel):
    serviceID: int
    status: str = "unknown"
    uptime: float = 100.0
    responseTime: float | None = None
    lastCheck: datetime | None = None
    checks: str | None = None
    alerts: str | None = None


class AIMonitoringCreate(AIMonitoringBase):
    pass


class AIMonitoringUpdate(BaseModel):
    serviceID: int | None = None
    status: str | None = None
    uptime: float | None = None
    responseTime: float | None = None
    lastCheck: datetime | None = None
    checks: str | None = None
    alerts: str | None = None


class AIMonitoringRead(AIMonitoringBase):
    monitoringID: int

    class Config:
        from_attributes = True

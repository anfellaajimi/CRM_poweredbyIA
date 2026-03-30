from datetime import datetime

from pydantic import BaseModel


class ProjetMilestoneBase(BaseModel):
    projetID: int
    title: str
    description: str | None = None
    dueDate: datetime | None = None
    status: str = "open"
    completedAt: datetime | None = None


class ProjetMilestoneCreate(BaseModel):
    title: str
    description: str | None = None
    dueDate: datetime | None = None


class ProjetMilestoneUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    dueDate: datetime | None = None
    status: str | None = None
    completedAt: datetime | None = None


class ProjetMilestoneRead(ProjetMilestoneBase):
    id: int
    createdAt: datetime

    class Config:
        from_attributes = True


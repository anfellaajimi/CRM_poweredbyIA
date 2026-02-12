from datetime import date, datetime

from pydantic import BaseModel


class ServiceBase(BaseModel):
    projetID: int
    nom: str
    type: str | None = None
    prix: float | None = None
    dateRenouvellement: date | None = None
    statut: str = "actif"
    url: str | None = None


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    projetID: int | None = None
    nom: str | None = None
    type: str | None = None
    prix: float | None = None
    dateRenouvellement: date | None = None
    statut: str | None = None
    url: str | None = None


class ServiceRead(ServiceBase):
    id: int
    createdAt: datetime

    class Config:
        from_attributes = True

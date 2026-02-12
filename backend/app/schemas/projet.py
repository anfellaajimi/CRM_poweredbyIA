from datetime import date, datetime

from pydantic import BaseModel


class ProjetBase(BaseModel):
    clientID: int
    nomProjet: str
    description: str | None = None
    status: str = "en_cours"
    dateDebut: date | None = None
    dateFin: date | None = None


class ProjetCreate(ProjetBase):
    pass


class ProjetUpdate(BaseModel):
    clientID: int | None = None
    nomProjet: str | None = None
    description: str | None = None
    status: str | None = None
    dateDebut: date | None = None
    dateFin: date | None = None


class ProjetRead(ProjetBase):
    id: int
    createdAt: datetime

    class Config:
        from_attributes = True

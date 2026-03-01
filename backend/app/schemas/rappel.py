from datetime import datetime

from pydantic import BaseModel


class RappelBase(BaseModel):
    clientID: int
    titre: str
    typeRappel: str | None = None
    dateRappel: datetime | None = None
    message: str | None = None
    statut: str = "en_attente"
    priorite: str = "moyenne"


class RappelCreate(RappelBase):
    pass


class RappelUpdate(BaseModel):
    clientID: int | None = None
    titre: str | None = None
    typeRappel: str | None = None
    dateRappel: datetime | None = None
    message: str | None = None
    statut: str | None = None
    priorite: str | None = None


class RappelRead(RappelBase):
    id: int
    createdAt: datetime

    class Config:
        from_attributes = True

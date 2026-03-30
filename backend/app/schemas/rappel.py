from datetime import datetime

from pydantic import BaseModel


class RappelBase(BaseModel):
    clientID: int | None = None
    projetID: int | None = None
    devisID: int | None = None
    factureID: int | None = None
    milestoneID: int | None = None
    titre: str
    typeRappel: str | None = None
    dateRappel: datetime | None = None
    message: str | None = None
    statut: str = "en_attente"
    priorite: str = "moyenne"
    systemKey: str | None = None
    emailSentAt: datetime | None = None
    emailLastError: str | None = None


class RappelCreate(RappelBase):
    pass


class RappelUpdate(BaseModel):
    clientID: int | None = None
    projetID: int | None = None
    devisID: int | None = None
    factureID: int | None = None
    milestoneID: int | None = None
    titre: str | None = None
    typeRappel: str | None = None
    dateRappel: datetime | None = None
    message: str | None = None
    statut: str | None = None
    priorite: str | None = None
    systemKey: str | None = None
    emailSentAt: datetime | None = None
    emailLastError: str | None = None


class RappelRead(RappelBase):
    id: int
    createdAt: datetime

    class Config:
        from_attributes = True

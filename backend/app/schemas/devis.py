from datetime import datetime

from pydantic import BaseModel


class DevisBase(BaseModel):
    clientID: int
    projetID: int | None = None
    dateDevis: datetime | None = None
    validUntil: datetime | None = None
    totalAmount: float
    status: str = "draft"
    notes: str | None = None


class DevisCreate(DevisBase):
    projetIDs: list[int] = []


class DevisUpdate(BaseModel):
    clientID: int | None = None
    projetID: int | None = None
    dateDevis: datetime | None = None
    validUntil: datetime | None = None
    totalAmount: float | None = None
    status: str | None = None
    notes: str | None = None
    projetIDs: list[int] | None = None


class DevisRead(DevisBase):
    devisID: int

    class Config:
        from_attributes = True

from datetime import datetime

from pydantic import BaseModel


class FactureBase(BaseModel):
    clientID: int
    devisID: int | None = None
    dateFacture: datetime | None = None
    dueDate: datetime | None = None
    amountHT: float
    amountTTC: float
    status: str = "en_attente"
    taxRate: float = 19.0
    paymentDate: datetime | None = None


class FactureCreate(FactureBase):
    projetIDs: list[int] = []


class FactureUpdate(BaseModel):
    clientID: int | None = None
    devisID: int | None = None
    dateFacture: datetime | None = None
    dueDate: datetime | None = None
    amountHT: float | None = None
    amountTTC: float | None = None
    status: str | None = None
    taxRate: float | None = None
    paymentDate: datetime | None = None
    projetIDs: list[int] | None = None


class FactureRead(FactureBase):
    factureID: int

    class Config:
        from_attributes = True

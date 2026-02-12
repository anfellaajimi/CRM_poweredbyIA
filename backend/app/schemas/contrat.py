from datetime import date

from pydantic import BaseModel


class ContratBase(BaseModel):
    clientID: int
    projetID: int | None = None
    dateDebut: date | None = None
    dateFin: date | None = None
    typeContrat: str
    montant: float
    conditions: str | None = None
    status: str = "actif"


class ContratCreate(ContratBase):
    pass


class ContratUpdate(BaseModel):
    clientID: int | None = None
    projetID: int | None = None
    dateDebut: date | None = None
    dateFin: date | None = None
    typeContrat: str | None = None
    montant: float | None = None
    conditions: str | None = None
    status: str | None = None


class ContratRead(ContratBase):
    contratID: int

    class Config:
        from_attributes = True

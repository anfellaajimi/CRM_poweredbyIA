from datetime import datetime

from pydantic import BaseModel


class CahierDeChargeBase(BaseModel):
    projetID: int
    objet: str
    description: str | None = None
    dateCreation: datetime | None = None
    dateValidation: datetime | None = None
    fileUrl: str | None = None
    version: str = "1.0"
    objectif: str | None = None
    perimetre: str | None = None
    fonctionnalites: str | None = None
    contraintes: str | None = None
    delais: str | None = None
    budgetTexte: str | None = None


class CahierDeChargeCreate(CahierDeChargeBase):
    pass


class CahierDeChargeUpdate(BaseModel):
    projetID: int | None = None
    objet: str | None = None
    description: str | None = None
    dateCreation: datetime | None = None
    dateValidation: datetime | None = None
    fileUrl: str | None = None
    version: str | None = None
    objectif: str | None = None
    perimetre: str | None = None
    fonctionnalites: str | None = None
    contraintes: str | None = None
    delais: str | None = None
    budgetTexte: str | None = None


class CahierDeChargeRead(CahierDeChargeBase):
    cahierID: int

    class Config:
        from_attributes = True

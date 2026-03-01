from datetime import date

from pydantic import BaseModel, model_validator


class ContratBase(BaseModel):
    clientID: int
    projetID: int | None = None
    titre: str | None = None
    objet: str | None = None
    obligations: str | None = None
    responsabilites: str | None = None
    dateDebut: date | None = None
    dateFin: date | None = None
    dateRenouvellement: date | None = None
    needsRenewal: bool = False
    typeContrat: str
    montant: float
    conditions: str | None = None
    status: str = "actif"

    @model_validator(mode="after")
    def validate_dates(self):
        if self.dateDebut and self.dateFin and self.dateFin < self.dateDebut:
            raise ValueError("dateFin must be after or equal to dateDebut")
        return self


class ContratCreate(ContratBase):
    pass


class ContratUpdate(BaseModel):
    clientID: int | None = None
    projetID: int | None = None
    titre: str | None = None
    objet: str | None = None
    obligations: str | None = None
    responsabilites: str | None = None
    dateDebut: date | None = None
    dateFin: date | None = None
    dateRenouvellement: date | None = None
    needsRenewal: bool | None = None
    typeContrat: str | None = None
    montant: float | None = None
    conditions: str | None = None
    status: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.dateDebut and self.dateFin and self.dateFin < self.dateDebut:
            raise ValueError("dateFin must be after or equal to dateDebut")
        return self


class ContratRead(ContratBase):
    contratID: int
    clientNom: str | None = None

    class Config:
        from_attributes = True

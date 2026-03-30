from datetime import date, datetime

from pydantic import BaseModel
from pydantic import field_validator


class ProjetBase(BaseModel):
    clientID: int
    nomProjet: str
    description: str | None = None
    status: str = "en_cours"
    priorite: str = "moyenne"
    budget: float | None = None
    depense: float = 0
    progression: int = 0
    scoring: str = "Moyen"
    isPinned: bool = False
    dateDebut: date | None = None
    dateFin: date | None = None

    @field_validator("progression")
    @classmethod
    def validate_progression(cls, value: int):
        if value < 0 or value > 100:
            raise ValueError("progression must be between 0 and 100")
        return value

    @field_validator("budget", "depense")
    @classmethod
    def validate_non_negative(cls, value: float | None):
        if value is not None and value < 0:
            raise ValueError("budget and depense must be non-negative")
        return value


class ProjetCreate(ProjetBase):
    pass


class ProjetUpdate(BaseModel):
    clientID: int | None = None
    nomProjet: str | None = None
    description: str | None = None
    status: str | None = None
    priorite: str | None = None
    budget: float | None = None
    depense: float | None = None
    progression: int | None = None
    scoring: str | None = None
    isPinned: bool | None = None
    dateDebut: date | None = None
    dateFin: date | None = None
    dateMaj: datetime | None = None

    @field_validator("progression")
    @classmethod
    def validate_update_progression(cls, value: int | None):
        if value is not None and (value < 0 or value > 100):
            raise ValueError("progression must be between 0 and 100")
        return value

    @field_validator("budget", "depense")
    @classmethod
    def validate_update_non_negative(cls, value: float | None):
        if value is not None and value < 0:
            raise ValueError("budget and depense must be non-negative")
        return value


class ProjetRead(ProjetBase):
    id: int
    createdAt: datetime
    dateMaj: datetime
    clientNom: str | None = None
    clientDevise: str | None = None
    assignedUsers: list[str] = []

    class Config:
        from_attributes = True

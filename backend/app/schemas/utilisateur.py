from datetime import datetime

from pydantic import BaseModel, EmailStr


class UtilisateurBase(BaseModel):
    nom: str
    email: EmailStr
    role: str = "developpeur"
    actif: bool = True


class UtilisateurCreate(UtilisateurBase):
    motDePasse: str


class UtilisateurUpdate(BaseModel):
    nom: str | None = None
    email: EmailStr | None = None
    role: str | None = None
    actif: bool | None = None
    motDePasse: str | None = None


class UtilisateurRead(UtilisateurBase):
    userID: int
    dateCreation: datetime

    class Config:
        from_attributes = True

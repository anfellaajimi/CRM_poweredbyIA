from datetime import date, datetime

from pydantic import BaseModel, EmailStr
from pydantic import model_validator


class ClientBase(BaseModel):
    typeClient: str = "moral"
    nom: str
    prenom: str | None = None
    email: EmailStr | None = None
    tel: str | None = None
    adresse: str | None = None
    dateNaissance: date | None = None
    cin: str | None = None
    raisonSociale: str | None = None
    matriculeFiscale: str | None = None
    secteurActivite: str | None = None
    entreprise: str | None = None
    avatarUrl: str | None = None
    status: str = "actif"
    devise: str = "TND"

    @model_validator(mode="after")
    def validate_type_specific_fields(self):
        client_type = (self.typeClient or "").lower()
        if client_type == "physique":
            if not self.prenom or not self.cin:
                raise ValueError("Client physique requires prenom and cin")
        if client_type == "moral":
            if not self.raisonSociale:
                raise ValueError("Client moral requires raisonSociale")
        return self


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    typeClient: str | None = None
    nom: str | None = None
    prenom: str | None = None
    email: EmailStr | None = None
    tel: str | None = None
    adresse: str | None = None
    dateNaissance: date | None = None
    cin: str | None = None
    raisonSociale: str | None = None
    matriculeFiscale: str | None = None
    secteurActivite: str | None = None
    entreprise: str | None = None
    avatarUrl: str | None = None
    status: str | None = None
    devise: str | None = None


class ClientRead(ClientBase):
    id: int
    dateCreation: datetime

    class Config:
        from_attributes = True

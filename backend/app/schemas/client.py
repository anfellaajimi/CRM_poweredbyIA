from datetime import datetime

from pydantic import BaseModel, EmailStr


class ClientBase(BaseModel):
    typeClient: str = "moral"
    nom: str
    email: EmailStr | None = None
    tel: str | None = None
    adresse: str | None = None
    status: str = "actif"


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    typeClient: str | None = None
    nom: str | None = None
    email: EmailStr | None = None
    tel: str | None = None
    adresse: str | None = None
    status: str | None = None


class ClientRead(ClientBase):
    id: int
    dateCreation: datetime

    class Config:
        from_attributes = True

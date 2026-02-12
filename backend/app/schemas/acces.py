from pydantic import BaseModel


class AccesBase(BaseModel):
    projetID: int | None = None
    serviceID: int | None = None
    login: str
    motDePasse: str
    url: str | None = None
    description: str | None = None
    note: str | None = None


class AccesCreate(AccesBase):
    pass


class AccesUpdate(BaseModel):
    projetID: int | None = None
    serviceID: int | None = None
    login: str | None = None
    motDePasse: str | None = None
    url: str | None = None
    description: str | None = None
    note: str | None = None


class AccesRead(AccesBase):
    accesID: int

    class Config:
        from_attributes = True

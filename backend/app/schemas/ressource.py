from pydantic import BaseModel


class RessourceBase(BaseModel):
    projetID: int
    nom: str
    type: str | None = None
    url: str | None = None
    description: str | None = None


class RessourceCreate(RessourceBase):
    pass


class RessourceUpdate(BaseModel):
    projetID: int | None = None
    nom: str | None = None
    type: str | None = None
    url: str | None = None
    description: str | None = None


class RessourceRead(RessourceBase):
    ressourceID: int

    class Config:
        from_attributes = True

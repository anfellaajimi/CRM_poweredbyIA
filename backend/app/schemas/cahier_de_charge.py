from datetime import datetime

from pydantic import BaseModel


class CahierDeChargeBase(BaseModel):
    projetID: int
    objet: str
    description: str | None = None
    dateCreation: datetime | None = None
    dateValidation: datetime | None = None
    fileUrl: str | None = None


class CahierDeChargeCreate(CahierDeChargeBase):
    pass


class CahierDeChargeUpdate(BaseModel):
    projetID: int | None = None
    objet: str | None = None
    description: str | None = None
    dateCreation: datetime | None = None
    dateValidation: datetime | None = None
    fileUrl: str | None = None


class CahierDeChargeRead(CahierDeChargeBase):
    cahierID: int

    class Config:
        from_attributes = True

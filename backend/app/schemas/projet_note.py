from datetime import datetime

from pydantic import BaseModel


class ProjetNoteCreate(BaseModel):
    contenu: str
    createdBy: int | None = None


class ProjetNoteRead(BaseModel):
    noteID: int
    projetID: int
    contenu: str
    createdAt: datetime
    createdBy: int | None = None

    class Config:
        from_attributes = True

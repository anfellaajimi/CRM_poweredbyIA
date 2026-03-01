from datetime import datetime

from pydantic import BaseModel


class ProjetFileRead(BaseModel):
    fileID: int
    projetID: int
    nom: str
    mimeType: str | None = None
    sizeBytes: int
    uploadedAt: datetime
    uploadedBy: int | None = None

    class Config:
        from_attributes = True

from datetime import date, datetime
from pydantic import BaseModel

class DeclarationCNSSRead(BaseModel):
    id: int
    userID: int
    frontId: str
    name: str
    description: str | None = None
    declarationDate: date
    pdfUrl: str
    pdfPublicId: str
    mimeType: str
    fileSize: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True

class DeclarationCNSSListRead(BaseModel):
    all: list[DeclarationCNSSRead]

from datetime import date, datetime

from pydantic import BaseModel


class UserContractRead(BaseModel):
    id: int
    userID: int
    frontId: str
    name: str
    type: str
    description: str | None = None
    status: str
    pdfUrl: str
    pdfPublicId: str
    mimeType: str
    fileSize: int
    createdAt: datetime
    updatedAt: datetime
    activatedAt: datetime | None = None
    archivedAt: datetime | None = None
    startDate: date | None = None
    endDate: date | None = None

    class Config:
        from_attributes = True


class UserContractsGroupedRead(BaseModel):
    active: UserContractRead | None = None
    history: list[UserContractRead]
    all: list[UserContractRead]

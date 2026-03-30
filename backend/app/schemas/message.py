from datetime import datetime

from pydantic import BaseModel


class MessageCreate(BaseModel):
    destinataireID: int
    contenu: str


class MessageRead(BaseModel):
    id: int
    expediteurID: int
    destinataireID: int
    contenu: str
    type: str = "text"
    mediaUrl: str | None = None
    mediaMimeType: str | None = None
    mediaDurationSec: int | None = None
    lu: bool
    createdAt: datetime

    class Config:
        from_attributes = True


class MessageUpdate(BaseModel):
    lu: bool | None = None


class ContactRead(BaseModel):
    userID: int
    nom: str
    role: str
    lastMessage: str | None = None
    lastMessageTime: datetime | None = None
    unreadCount: int = 0

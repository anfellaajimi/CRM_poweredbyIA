from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base_class import Base

class ClientPortalUser(Base):
    __tablename__ = "client_portal_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    motDePasse: Mapped[str] = mapped_column(String(255), nullable=False)
    clientID: Mapped[int] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    isActive: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    createdAt: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    client = relationship("Client")
    
    @property
    def role(self) -> str:
        return "client"
    
    @property
    def nom(self) -> str:
        return self.email.split('@')[0]

    @property
    def avatarUrl(self) -> str:
        return ""

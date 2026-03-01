from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class DevisItemPayload(BaseModel):
    description: str
    quantity: float = 1
    unitPrice: float = 0
    lineTotal: float | None = None

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, value: float):
        if value <= 0:
            raise ValueError("quantity must be positive")
        return value

    @field_validator("unitPrice")
    @classmethod
    def validate_unit_price(cls, value: float):
        if value < 0:
            raise ValueError("unitPrice must be non-negative")
        return value


class DevisItemRead(DevisItemPayload):
    itemID: int


class DevisBase(BaseModel):
    clientID: int
    projetID: int | None = None
    dateDevis: datetime | None = None
    validUntil: datetime | None = None
    totalAmount: float = 0
    status: str = "draft"
    notes: str | None = None
    items: list[DevisItemPayload] = Field(default_factory=list)


class DevisCreate(DevisBase):
    projetIDs: list[int] = []


class DevisUpdate(BaseModel):
    clientID: int | None = None
    projetID: int | None = None
    dateDevis: datetime | None = None
    validUntil: datetime | None = None
    totalAmount: float | None = None
    status: str | None = None
    notes: str | None = None
    projetIDs: list[int] | None = None
    items: list[DevisItemPayload] | None = None


class DevisRead(DevisBase):
    devisID: int
    clientNom: str | None = None
    items: list[DevisItemRead] = Field(default_factory=list)

    class Config:
        from_attributes = True

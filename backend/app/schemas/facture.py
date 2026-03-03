from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class FactureItemPayload(BaseModel):
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


class FactureItemRead(FactureItemPayload):
    itemID: int


class FactureBase(BaseModel):
    clientID: int
    devisID: int | None = None
    dateFacture: datetime | None = None
    dueDate: datetime | None = None
    amountHT: float = 0
    amountTTC: float = 0
    status: str = "en_attente"
    taxRate: float = 19.0
    paymentDate: datetime | None = None
    items: list[FactureItemPayload] = Field(default_factory=list)


class FactureCreate(FactureBase):
    projetIDs: list[int] = []


class FactureUpdate(BaseModel):
    clientID: int | None = None
    devisID: int | None = None
    dateFacture: datetime | None = None
    dueDate: datetime | None = None
    amountHT: float | None = None
    amountTTC: float | None = None
    status: str | None = None
    taxRate: float | None = None
    paymentDate: datetime | None = None
    projetIDs: list[int] | None = None
    items: list[FactureItemPayload] | None = None


class FactureRead(FactureBase):
    factureID: int
    clientNom: str | None = None
    clientDevise: str | None = None
    items: list[FactureItemRead] = Field(default_factory=list)

    class Config:
        from_attributes = True

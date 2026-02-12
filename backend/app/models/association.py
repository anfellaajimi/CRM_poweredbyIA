from sqlalchemy import ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base


class ProjetUtilisateur(Base):
    __tablename__ = "projet_utilisateurs"

    projetID: Mapped[int] = mapped_column(ForeignKey("projets.id", ondelete="CASCADE"), primary_key=True, index=True)
    userID: Mapped[int] = mapped_column(ForeignKey("utilisateurs.userID", ondelete="CASCADE"), primary_key=True, index=True)


class DevisProjet(Base):
    __tablename__ = "devis_projets"

    devisID: Mapped[int] = mapped_column(ForeignKey("devis.devisID", ondelete="CASCADE"), primary_key=True, index=True)
    projetID: Mapped[int] = mapped_column(ForeignKey("projets.id", ondelete="CASCADE"), primary_key=True, index=True)


class FactureProjet(Base):
    __tablename__ = "facture_projets"

    factureID: Mapped[int] = mapped_column(ForeignKey("factures.factureID", ondelete="CASCADE"), primary_key=True, index=True)
    projetID: Mapped[int] = mapped_column(ForeignKey("projets.id", ondelete="CASCADE"), primary_key=True, index=True)

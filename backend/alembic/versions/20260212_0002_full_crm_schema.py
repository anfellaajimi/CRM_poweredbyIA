"""full crm schema

Revision ID: 20260212_0002
Revises: 20260212_0001
Create Date: 2026-02-12 22:10:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260212_0002"
down_revision: Union[str, None] = "20260212_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("ai_monitoring")
    op.drop_table("factures")
    op.drop_table("services")
    op.drop_table("rappels")
    op.drop_table("projets")
    op.drop_table("clients")

    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("typeClient", sa.String(length=50), nullable=False),
        sa.Column("nom", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("tel", sa.String(length=50), nullable=True),
        sa.Column("adresse", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("dateCreation", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_clients_id", "clients", ["id"], unique=False)
    op.create_index("ix_clients_email", "clients", ["email"], unique=True)

    op.create_table(
        "projets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clientID", sa.Integer(), nullable=False),
        sa.Column("nomProjet", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("dateDebut", sa.Date(), nullable=True),
        sa.Column("dateFin", sa.Date(), nullable=True),
        sa.Column("createdAt", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["clientID"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_projets_id", "projets", ["id"], unique=False)
    op.create_index("ix_projets_clientID", "projets", ["clientID"], unique=False)
    op.create_index("ix_projets_status", "projets", ["status"], unique=False)

    op.create_table(
        "ressources",
        sa.Column("ressourceID", sa.Integer(), nullable=False),
        sa.Column("projetID", sa.Integer(), nullable=False),
        sa.Column("nom", sa.String(length=200), nullable=False),
        sa.Column("type", sa.String(length=100), nullable=True),
        sa.Column("url", sa.String(length=500), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["projetID"], ["projets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("ressourceID"),
    )
    op.create_index("ix_ressources_ressourceID", "ressources", ["ressourceID"], unique=False)
    op.create_index("ix_ressources_projetID", "ressources", ["projetID"], unique=False)

    op.create_table(
        "utilisateurs",
        sa.Column("userID", sa.Integer(), nullable=False),
        sa.Column("nom", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("motDePasse", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("actif", sa.Boolean(), nullable=False),
        sa.Column("dateCreation", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("userID"),
    )
    op.create_index("ix_utilisateurs_userID", "utilisateurs", ["userID"], unique=False)
    op.create_index("ix_utilisateurs_email", "utilisateurs", ["email"], unique=True)

    op.create_table(
        "projet_utilisateurs",
        sa.Column("projetID", sa.Integer(), nullable=False),
        sa.Column("userID", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["projetID"], ["projets.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["userID"], ["utilisateurs.userID"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("projetID", "userID"),
    )
    op.create_index("ix_projet_utilisateurs_projetID", "projet_utilisateurs", ["projetID"], unique=False)
    op.create_index("ix_projet_utilisateurs_userID", "projet_utilisateurs", ["userID"], unique=False)

    op.create_table(
        "services",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("projetID", sa.Integer(), nullable=False),
        sa.Column("nom", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=True),
        sa.Column("prix", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("dateRenouvellement", sa.Date(), nullable=True),
        sa.Column("statut", sa.String(length=50), nullable=False),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("createdAt", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["projetID"], ["projets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_services_id", "services", ["id"], unique=False)
    op.create_index("ix_services_projetID", "services", ["projetID"], unique=False)
    op.create_index("ix_services_statut", "services", ["statut"], unique=False)

    op.create_table(
        "acces",
        sa.Column("accesID", sa.Integer(), nullable=False),
        sa.Column("projetID", sa.Integer(), nullable=True),
        sa.Column("serviceID", sa.Integer(), nullable=True),
        sa.Column("login", sa.String(length=200), nullable=False),
        sa.Column("motDePasse", sa.String(length=500), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=True),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["projetID"], ["projets.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["serviceID"], ["services.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("accesID"),
    )
    op.create_index("ix_acces_accesID", "acces", ["accesID"], unique=False)
    op.create_index("ix_acces_projetID", "acces", ["projetID"], unique=False)
    op.create_index("ix_acces_serviceID", "acces", ["serviceID"], unique=False)

    op.create_table(
        "rappels",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("clientID", sa.Integer(), nullable=False),
        sa.Column("typeRappel", sa.String(length=50), nullable=True),
        sa.Column("dateRappel", sa.DateTime(), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("statut", sa.String(length=50), nullable=False),
        sa.Column("priorite", sa.String(length=50), nullable=False),
        sa.Column("createdAt", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["clientID"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_rappels_id", "rappels", ["id"], unique=False)
    op.create_index("ix_rappels_clientID", "rappels", ["clientID"], unique=False)
    op.create_index("ix_rappels_statut", "rappels", ["statut"], unique=False)

    op.create_table(
        "devis",
        sa.Column("devisID", sa.Integer(), nullable=False),
        sa.Column("clientID", sa.Integer(), nullable=False),
        sa.Column("projetID", sa.Integer(), nullable=True),
        sa.Column("dateDevis", sa.DateTime(), nullable=False),
        sa.Column("validUntil", sa.DateTime(), nullable=True),
        sa.Column("totalAmount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["clientID"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["projetID"], ["projets.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("devisID"),
    )
    op.create_index("ix_devis_devisID", "devis", ["devisID"], unique=False)
    op.create_index("ix_devis_clientID", "devis", ["clientID"], unique=False)
    op.create_index("ix_devis_projetID", "devis", ["projetID"], unique=False)
    op.create_index("ix_devis_status", "devis", ["status"], unique=False)

    op.create_table(
        "devis_projets",
        sa.Column("devisID", sa.Integer(), nullable=False),
        sa.Column("projetID", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["devisID"], ["devis.devisID"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["projetID"], ["projets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("devisID", "projetID"),
    )
    op.create_index("ix_devis_projets_devisID", "devis_projets", ["devisID"], unique=False)
    op.create_index("ix_devis_projets_projetID", "devis_projets", ["projetID"], unique=False)

    op.create_table(
        "factures",
        sa.Column("factureID", sa.Integer(), nullable=False),
        sa.Column("clientID", sa.Integer(), nullable=False),
        sa.Column("devisID", sa.Integer(), nullable=True),
        sa.Column("dateFacture", sa.DateTime(), nullable=False),
        sa.Column("dueDate", sa.DateTime(), nullable=True),
        sa.Column("amountHT", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("amountTTC", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("taxRate", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("paymentDate", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["clientID"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["devisID"], ["devis.devisID"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("factureID"),
    )
    op.create_index("ix_factures_factureID", "factures", ["factureID"], unique=False)
    op.create_index("ix_factures_clientID", "factures", ["clientID"], unique=False)
    op.create_index("ix_factures_devisID", "factures", ["devisID"], unique=False)
    op.create_index("ix_factures_status", "factures", ["status"], unique=False)

    op.create_table(
        "facture_projets",
        sa.Column("factureID", sa.Integer(), nullable=False),
        sa.Column("projetID", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["factureID"], ["factures.factureID"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["projetID"], ["projets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("factureID", "projetID"),
    )
    op.create_index("ix_facture_projets_factureID", "facture_projets", ["factureID"], unique=False)
    op.create_index("ix_facture_projets_projetID", "facture_projets", ["projetID"], unique=False)

    op.create_table(
        "contrats",
        sa.Column("contratID", sa.Integer(), nullable=False),
        sa.Column("clientID", sa.Integer(), nullable=False),
        sa.Column("projetID", sa.Integer(), nullable=True),
        sa.Column("dateDebut", sa.Date(), nullable=True),
        sa.Column("dateFin", sa.Date(), nullable=True),
        sa.Column("typeContrat", sa.String(length=100), nullable=False),
        sa.Column("montant", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("conditions", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.ForeignKeyConstraint(["clientID"], ["clients.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["projetID"], ["projets.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("contratID"),
    )
    op.create_index("ix_contrats_contratID", "contrats", ["contratID"], unique=False)
    op.create_index("ix_contrats_clientID", "contrats", ["clientID"], unique=False)
    op.create_index("ix_contrats_projetID", "contrats", ["projetID"], unique=False)
    op.create_index("ix_contrats_status", "contrats", ["status"], unique=False)

    op.create_table(
        "cahier_de_charge",
        sa.Column("cahierID", sa.Integer(), nullable=False),
        sa.Column("projetID", sa.Integer(), nullable=False),
        sa.Column("objet", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("dateCreation", sa.DateTime(), nullable=False),
        sa.Column("dateValidation", sa.DateTime(), nullable=True),
        sa.Column("fileUrl", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["projetID"], ["projets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("cahierID"),
        sa.UniqueConstraint("projetID"),
    )
    op.create_index("ix_cahier_de_charge_cahierID", "cahier_de_charge", ["cahierID"], unique=False)
    op.create_index("ix_cahier_de_charge_projetID", "cahier_de_charge", ["projetID"], unique=True)

    op.create_table(
        "ai_monitoring",
        sa.Column("monitoringID", sa.Integer(), nullable=False),
        sa.Column("serviceID", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("uptime", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("responseTime", sa.Numeric(precision=8, scale=3), nullable=True),
        sa.Column("lastCheck", sa.DateTime(), nullable=False),
        sa.Column("checks", sa.Text(), nullable=True),
        sa.Column("alerts", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["serviceID"], ["services.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("monitoringID"),
        sa.UniqueConstraint("serviceID"),
    )
    op.create_index("ix_ai_monitoring_monitoringID", "ai_monitoring", ["monitoringID"], unique=False)
    op.create_index("ix_ai_monitoring_serviceID", "ai_monitoring", ["serviceID"], unique=True)
    op.create_index("ix_ai_monitoring_status", "ai_monitoring", ["status"], unique=False)


def downgrade() -> None:
    raise NotImplementedError("Downgrade is not supported for revision 20260212_0002")

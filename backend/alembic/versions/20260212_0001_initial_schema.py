"""initial schema

Revision ID: 20260212_0001
Revises:
Create Date: 2026-02-12 17:50:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260212_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "clients",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("type_client", sa.String(length=50), nullable=False),
        sa.Column("nom", sa.String(length=255), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("tel", sa.String(length=50), nullable=True),
        sa.Column("adresse", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("date_creation", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_clients_id", "clients", ["id"], unique=False)
    op.create_index("ix_clients_email", "clients", ["email"], unique=True)

    op.create_table(
        "projets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("nom_projet", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("date_debut", sa.Date(), nullable=True),
        sa.Column("date_fin", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_projets_id", "projets", ["id"], unique=False)
    op.create_index("ix_projets_client_id", "projets", ["client_id"], unique=False)

    op.create_table(
        "rappels",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("type_rappel", sa.String(length=50), nullable=True),
        sa.Column("date_rappel", sa.DateTime(), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("statut", sa.String(length=50), nullable=False),
        sa.Column("priorite", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_rappels_id", "rappels", ["id"], unique=False)
    op.create_index("ix_rappels_client_id", "rappels", ["client_id"], unique=False)

    op.create_table(
        "services",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("projet_id", sa.Integer(), nullable=False),
        sa.Column("nom", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=True),
        sa.Column("prix", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("date_renouvellement", sa.Date(), nullable=True),
        sa.Column("statut", sa.String(length=50), nullable=False),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["projet_id"], ["projets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_services_id", "services", ["id"], unique=False)
    op.create_index("ix_services_projet_id", "services", ["projet_id"], unique=False)

    op.create_table(
        "factures",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("client_id", sa.Integer(), nullable=False),
        sa.Column("numero_facture", sa.String(length=100), nullable=False),
        sa.Column("date_emission", sa.DateTime(), nullable=False),
        sa.Column("date_echeance", sa.DateTime(), nullable=True),
        sa.Column("montant_ht", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("montant_ttc", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("taux_tva", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("statut", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("fichier_pdf", sa.String(length=500), nullable=True),
        sa.ForeignKeyConstraint(["client_id"], ["clients.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_factures_id", "factures", ["id"], unique=False)
    op.create_index("ix_factures_client_id", "factures", ["client_id"], unique=False)
    op.create_index("ix_factures_numero_facture", "factures", ["numero_facture"], unique=True)

    op.create_table(
        "ai_monitoring",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("service_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("uptime", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("response_time", sa.Numeric(precision=8, scale=3), nullable=True),
        sa.Column("last_check", sa.DateTime(), nullable=False),
        sa.Column("checks", sa.Text(), nullable=True),
        sa.Column("alerts", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("service_id"),
    )
    op.create_index("ix_ai_monitoring_id", "ai_monitoring", ["id"], unique=False)
    op.create_index("ix_ai_monitoring_service_id", "ai_monitoring", ["service_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_ai_monitoring_service_id", table_name="ai_monitoring")
    op.drop_index("ix_ai_monitoring_id", table_name="ai_monitoring")
    op.drop_table("ai_monitoring")

    op.drop_index("ix_factures_numero_facture", table_name="factures")
    op.drop_index("ix_factures_client_id", table_name="factures")
    op.drop_index("ix_factures_id", table_name="factures")
    op.drop_table("factures")

    op.drop_index("ix_services_projet_id", table_name="services")
    op.drop_index("ix_services_id", table_name="services")
    op.drop_table("services")

    op.drop_index("ix_rappels_client_id", table_name="rappels")
    op.drop_index("ix_rappels_id", table_name="rappels")
    op.drop_table("rappels")

    op.drop_index("ix_projets_client_id", table_name="projets")
    op.drop_index("ix_projets_id", table_name="projets")
    op.drop_table("projets")

    op.drop_index("ix_clients_email", table_name="clients")
    op.drop_index("ix_clients_id", table_name="clients")
    op.drop_table("clients")

    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_table("users")

"""finance contracts users expansion

Revision ID: 20260301_0004
Revises: 20260301_0003
Create Date: 2026-03-01 23:50:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260301_0004"
down_revision: Union[str, None] = "20260301_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS devis_items CASCADE")
    op.execute("DROP TABLE IF EXISTS facture_items CASCADE")

    op.create_table(
        "devis_items",
        sa.Column("itemID", sa.Integer(), nullable=False),
        sa.Column("devisID", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=10, scale=2), nullable=False, server_default="1"),
        sa.Column("unitPrice", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0"),
        sa.Column("lineTotal", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["devisID"], ["devis.devisID"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("itemID"),
    )
    op.create_index("ix_devis_items_itemID", "devis_items", ["itemID"], unique=False)
    op.create_index("ix_devis_items_devisID", "devis_items", ["devisID"], unique=False)

    op.create_table(
        "facture_items",
        sa.Column("itemID", sa.Integer(), nullable=False),
        sa.Column("factureID", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("quantity", sa.Numeric(precision=10, scale=2), nullable=False, server_default="1"),
        sa.Column("unitPrice", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0"),
        sa.Column("lineTotal", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["factureID"], ["factures.factureID"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("itemID"),
    )
    op.create_index("ix_facture_items_itemID", "facture_items", ["itemID"], unique=False)
    op.create_index("ix_facture_items_factureID", "facture_items", ["factureID"], unique=False)

    op.add_column("contrats", sa.Column("titre", sa.String(length=255), nullable=True))
    op.add_column("contrats", sa.Column("objet", sa.Text(), nullable=True))
    op.add_column("contrats", sa.Column("obligations", sa.Text(), nullable=True))
    op.add_column("contrats", sa.Column("responsabilites", sa.Text(), nullable=True))
    op.add_column("contrats", sa.Column("dateRenouvellement", sa.Date(), nullable=True))
    op.add_column("contrats", sa.Column("needsRenewal", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.create_index("ix_contrats_dateRenouvellement", "contrats", ["dateRenouvellement"], unique=False)
    op.create_index("ix_contrats_needsRenewal", "contrats", ["needsRenewal"], unique=False)

    op.execute('UPDATE contrats SET titre = "typeContrat" WHERE titre IS NULL')
    op.execute(
        """
        UPDATE contrats
        SET "needsRenewal" = CASE
            WHEN "dateFin" IS NOT NULL AND "dateFin" <= (CURRENT_DATE + INTERVAL '30 days') THEN TRUE
            ELSE FALSE
        END
        """
    )
    op.alter_column("contrats", "needsRenewal", server_default=None)


def downgrade() -> None:
    raise NotImplementedError("Downgrade is not supported for revision 20260301_0004")

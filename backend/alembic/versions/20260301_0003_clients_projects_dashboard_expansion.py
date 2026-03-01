"""clients projects dashboard expansion

Revision ID: 20260301_0003
Revises: 20260212_0002
Create Date: 2026-03-01 22:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260301_0003"
down_revision: Union[str, None] = "20260212_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS projet_notes CASCADE")
    op.execute("DROP TABLE IF EXISTS projet_files CASCADE")
    op.execute("DROP TABLE IF EXISTS activity_events CASCADE")

    op.add_column("clients", sa.Column("prenom", sa.String(length=255), nullable=True))
    op.add_column("clients", sa.Column("dateNaissance", sa.Date(), nullable=True))
    op.add_column("clients", sa.Column("cin", sa.String(length=100), nullable=True))
    op.add_column("clients", sa.Column("raisonSociale", sa.String(length=255), nullable=True))
    op.add_column("clients", sa.Column("matriculeFiscale", sa.String(length=255), nullable=True))
    op.add_column("clients", sa.Column("secteurActivite", sa.String(length=255), nullable=True))
    op.add_column("clients", sa.Column("entreprise", sa.String(length=255), nullable=True))
    op.add_column("clients", sa.Column("avatarUrl", sa.String(length=500), nullable=True))

    op.add_column("projets", sa.Column("priorite", sa.String(length=50), nullable=False, server_default="moyenne"))
    op.add_column("projets", sa.Column("budget", sa.Numeric(precision=12, scale=2), nullable=True))
    op.add_column("projets", sa.Column("depense", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0"))
    op.add_column("projets", sa.Column("progression", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("projets", sa.Column("dateMaj", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")))

    op.add_column("cahier_de_charge", sa.Column("version", sa.String(length=30), nullable=False, server_default="1.0"))
    op.add_column("cahier_de_charge", sa.Column("objectif", sa.Text(), nullable=True))
    op.add_column("cahier_de_charge", sa.Column("perimetre", sa.Text(), nullable=True))
    op.add_column("cahier_de_charge", sa.Column("fonctionnalites", sa.Text(), nullable=True))
    op.add_column("cahier_de_charge", sa.Column("contraintes", sa.Text(), nullable=True))
    op.add_column("cahier_de_charge", sa.Column("delais", sa.Text(), nullable=True))
    op.add_column("cahier_de_charge", sa.Column("budgetTexte", sa.Text(), nullable=True))

    op.create_table(
        "projet_notes",
        sa.Column("noteID", sa.Integer(), nullable=False),
        sa.Column("projetID", sa.Integer(), nullable=False),
        sa.Column("contenu", sa.Text(), nullable=False),
        sa.Column("createdAt", sa.DateTime(), nullable=False),
        sa.Column("createdBy", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["createdBy"], ["utilisateurs.userID"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["projetID"], ["projets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("noteID"),
    )
    op.create_index("ix_projet_notes_noteID", "projet_notes", ["noteID"], unique=False)
    op.create_index("ix_projet_notes_projetID", "projet_notes", ["projetID"], unique=False)
    op.create_index("ix_projet_notes_createdBy", "projet_notes", ["createdBy"], unique=False)

    op.create_table(
        "projet_files",
        sa.Column("fileID", sa.Integer(), nullable=False),
        sa.Column("projetID", sa.Integer(), nullable=False),
        sa.Column("nom", sa.String(length=255), nullable=False),
        sa.Column("mimeType", sa.String(length=255), nullable=True),
        sa.Column("sizeBytes", sa.Integer(), nullable=False),
        sa.Column("storagePath", sa.String(length=1000), nullable=False),
        sa.Column("uploadedAt", sa.DateTime(), nullable=False),
        sa.Column("uploadedBy", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["uploadedBy"], ["utilisateurs.userID"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["projetID"], ["projets.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("fileID"),
    )
    op.create_index("ix_projet_files_fileID", "projet_files", ["fileID"], unique=False)
    op.create_index("ix_projet_files_projetID", "projet_files", ["projetID"], unique=False)
    op.create_index("ix_projet_files_uploadedBy", "projet_files", ["uploadedBy"], unique=False)

    op.create_table(
        "activity_events",
        sa.Column("eventID", sa.Integer(), nullable=False),
        sa.Column("entityType", sa.String(length=100), nullable=False),
        sa.Column("entityID", sa.Integer(), nullable=True),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("createdAt", sa.DateTime(), nullable=False),
        sa.Column("actor", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("eventID"),
    )
    op.create_index("ix_activity_events_eventID", "activity_events", ["eventID"], unique=False)
    op.create_index("ix_activity_events_entityType", "activity_events", ["entityType"], unique=False)
    op.create_index("ix_activity_events_entityID", "activity_events", ["entityID"], unique=False)
    op.create_index("ix_activity_events_createdAt", "activity_events", ["createdAt"], unique=False)

    op.execute(
        """
        UPDATE clients
        SET "entreprise" = nom
        WHERE "entreprise" IS NULL AND LOWER("typeClient") = 'moral'
        """
    )

    op.alter_column("projets", "priorite", server_default=None)
    op.alter_column("projets", "depense", server_default=None)
    op.alter_column("projets", "progression", server_default=None)
    op.alter_column("projets", "dateMaj", server_default=None)
    op.alter_column("cahier_de_charge", "version", server_default=None)


def downgrade() -> None:
    raise NotImplementedError("Downgrade is not supported for revision 20260301_0003")

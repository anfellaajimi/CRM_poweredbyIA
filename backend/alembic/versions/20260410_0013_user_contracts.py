"""add user contracts

Revision ID: 20260410_0013
Revises: 20260330_0012
Create Date: 2026-04-10 10:00:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260410_0013"
down_revision: Union[str, None] = "20260330_0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_contracts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("userID", sa.Integer(), nullable=False),
        sa.Column("frontId", sa.String(length=120), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("type", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False, server_default=sa.text("'inactive'")),
        sa.Column("pdfUrl", sa.String(length=1000), nullable=False),
        sa.Column("pdfPublicId", sa.String(length=300), nullable=False),
        sa.Column("mimeType", sa.String(length=100), nullable=False, server_default=sa.text("'application/pdf'")),
        sa.Column("fileSize", sa.Integer(), nullable=False),
        sa.Column("createdAt", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updatedAt", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("activatedAt", sa.DateTime(), nullable=True),
        sa.Column("archivedAt", sa.DateTime(), nullable=True),
        sa.CheckConstraint('"status" IN (\'active\', \'inactive\')', name="ck_user_contracts_status"),
        sa.ForeignKeyConstraint(["userID"], ["utilisateurs.userID"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("frontId", name="uq_user_contracts_frontId"),
    )

    op.create_index("ix_user_contracts_id", "user_contracts", ["id"], unique=False)
    op.create_index("ix_user_contracts_userID", "user_contracts", ["userID"], unique=False)
    op.create_index("ix_user_contracts_status", "user_contracts", ["status"], unique=False)
    op.create_index("ix_user_contracts_createdAt", "user_contracts", ["createdAt"], unique=False)
    op.create_index("ix_user_contracts_frontId", "user_contracts", ["frontId"], unique=True)
    op.create_index(
        "ux_user_contracts_one_active_per_user",
        "user_contracts",
        ["userID"],
        unique=True,
        postgresql_where=sa.text('"status" = \'active\''),
    )


def downgrade() -> None:
    raise NotImplementedError("Downgrade is not supported for revision 20260410_0013")

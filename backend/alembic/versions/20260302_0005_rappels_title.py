"""add rappels titre

Revision ID: 20260302_0005
Revises: 20260301_0004
Create Date: 2026-03-02 00:20:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260302_0005"
down_revision: Union[str, None] = "20260301_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("rappels", sa.Column("titre", sa.String(length=255), nullable=True))
    op.execute('UPDATE rappels SET titre = "typeRappel" WHERE titre IS NULL AND "typeRappel" IS NOT NULL')
    op.execute("UPDATE rappels SET titre = 'Rappel' WHERE titre IS NULL")
    op.alter_column("rappels", "titre", nullable=False)
    op.create_index("ix_rappels_titre", "rappels", ["titre"], unique=False)


def downgrade() -> None:
    raise NotImplementedError("Downgrade is not supported for revision 20260302_0005")

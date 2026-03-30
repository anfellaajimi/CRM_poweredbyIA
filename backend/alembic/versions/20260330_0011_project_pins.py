"""project pins

Revision ID: 20260330_0011
Revises: 20260330_0010
Create Date: 2026-03-30 18:00:00
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260330_0011"
down_revision: Union[str, None] = "20260330_0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE projets ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT FALSE')
    op.execute('CREATE INDEX IF NOT EXISTS "ix_projets_isPinned" ON projets ("isPinned")')


def downgrade() -> None:
    raise NotImplementedError("Downgrade is not supported for revision 20260330_0011")


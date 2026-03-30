"""add cahier extra fields

Revision ID: 20260330_0009
Revises: 20260330_0008_messages
Create Date: 2026-03-30 12:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260330_0009"
down_revision: Union[str, None] = "20260330_0008_messages"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Make this migration safe to re-run on databases that already have these columns
    # (e.g. when schema was updated manually but alembic_version lagged behind).
    op.execute('ALTER TABLE cahier_de_charge ADD COLUMN IF NOT EXISTS "userStories" TEXT')
    op.execute('ALTER TABLE cahier_de_charge ADD COLUMN IF NOT EXISTS "reglesMetier" TEXT')
    op.execute('ALTER TABLE cahier_de_charge ADD COLUMN IF NOT EXISTS "documentsReference" TEXT')


def downgrade() -> None:
    op.execute('ALTER TABLE cahier_de_charge DROP COLUMN IF EXISTS "documentsReference"')
    op.execute('ALTER TABLE cahier_de_charge DROP COLUMN IF EXISTS "reglesMetier"')
    op.execute('ALTER TABLE cahier_de_charge DROP COLUMN IF EXISTS "userStories"')

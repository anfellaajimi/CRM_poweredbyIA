"""add resolved_at to rappels

Revision ID: 20260502_0014
Revises: 20260410_0013_user_contracts
Create Date: 2026-05-02 22:00:00
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260502_0014"
down_revision = "20260410_0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("rappels", sa.Column("resolvedAt", sa.DateTime(), nullable=True))
    op.create_index("ix_rappels_resolvedAt", "rappels", ["resolvedAt"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_rappels_resolvedAt", table_name="rappels")
    op.drop_column("rappels", "resolvedAt")

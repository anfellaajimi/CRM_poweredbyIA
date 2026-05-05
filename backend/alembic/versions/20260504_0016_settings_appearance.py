"""add appearance fields to app settings

Revision ID: 20260504_0016
Revises: 20260504_0015
Create Date: 2026-05-04 12:20:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260504_0016"
down_revision: Union[str, Sequence[str], None] = "20260504_0015"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "app_settings",
        sa.Column("appearance_theme", sa.String(length=20), nullable=True, server_default="light"),
    )
    op.add_column(
        "app_settings",
        sa.Column("appearance_primary_color", sa.String(length=20), nullable=True, server_default="#6366f1"),
    )


def downgrade() -> None:
    op.drop_column("app_settings", "appearance_primary_color")
    op.drop_column("app_settings", "appearance_theme")

"""add notification settings fields to app settings

Revision ID: 20260504_0015
Revises: 20260502_0014_rappel_resolved_at
Create Date: 2026-05-04 12:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "20260504_0015"
down_revision: Union[str, Sequence[str], None] = "20260502_0014"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "app_settings",
        sa.Column("notifications_enabled", sa.Boolean(), nullable=True, server_default=sa.true()),
    )
    op.add_column(
        "app_settings",
        sa.Column("notifications_email_enabled", sa.Boolean(), nullable=True, server_default=sa.false()),
    )
    op.add_column(
        "app_settings",
        sa.Column("notifications_push_enabled", sa.Boolean(), nullable=True, server_default=sa.true()),
    )
    op.add_column(
        "app_settings",
        sa.Column("notifications_daily_digest_enabled", sa.Boolean(), nullable=True, server_default=sa.false()),
    )
    op.add_column(
        "app_settings",
        sa.Column("notifications_email_recipients", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("app_settings", "notifications_email_recipients")
    op.drop_column("app_settings", "notifications_daily_digest_enabled")
    op.drop_column("app_settings", "notifications_push_enabled")
    op.drop_column("app_settings", "notifications_email_enabled")
    op.drop_column("app_settings", "notifications_enabled")

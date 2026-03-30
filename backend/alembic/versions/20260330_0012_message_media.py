"""message media fields

Revision ID: 20260330_0012
Revises: 20260330_0011
Create Date: 2026-03-30 20:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260330_0012"
down_revision: Union[str, None] = "20260330_0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "messages",
        sa.Column("type", sa.String(length=20), nullable=False, server_default=sa.text("'text'")),
    )
    op.add_column("messages", sa.Column("mediaUrl", sa.Text(), nullable=True))
    op.add_column("messages", sa.Column("mediaMimeType", sa.String(length=100), nullable=True))
    op.add_column("messages", sa.Column("mediaDurationSec", sa.Integer(), nullable=True))
    op.create_index(op.f("ix_messages_type"), "messages", ["type"], unique=False)


def downgrade() -> None:
    raise NotImplementedError("Downgrade is not supported for revision 20260330_0012")

"""add messages table

Revision ID: 20260330_0008_messages
Revises: 456234d49a72
Create Date: 2026-03-30 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = "20260330_0008_messages"
down_revision = "456234d49a72"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("expediteurID", sa.Integer(), nullable=False),
        sa.Column("destinataireID", sa.Integer(), nullable=False),
        sa.Column("contenu", sa.Text(), nullable=False),
        sa.Column("lu", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("createdAt", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["expediteurID"], ["utilisateurs.userID"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["destinataireID"], ["utilisateurs.userID"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_messages_id"), "messages", ["id"], unique=False)
    op.create_index(op.f("ix_messages_expediteurID"), "messages", ["expediteurID"], unique=False)
    op.create_index(op.f("ix_messages_destinataireID"), "messages", ["destinataireID"], unique=False)
    op.create_index(op.f("ix_messages_createdAt"), "messages", ["createdAt"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_messages_createdAt"), table_name="messages")
    op.drop_index(op.f("ix_messages_destinataireID"), table_name="messages")
    op.drop_index(op.f("ix_messages_expediteurID"), table_name="messages")
    op.drop_index(op.f("ix_messages_id"), table_name="messages")
    op.drop_table("messages")

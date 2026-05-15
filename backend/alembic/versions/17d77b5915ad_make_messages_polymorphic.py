"""make_messages_polymorphic

Revision ID: 17d77b5915ad
Revises: 7113ac7c0758
Create Date: 2026-05-13 00:02:47.031626
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '17d77b5915ad'
down_revision: Union[str, None] = '7113ac7c0758'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('messages', sa.Column('expediteurType', sa.String(length=20), server_default='staff', nullable=False))
    op.add_column('messages', sa.Column('destinataireType', sa.String(length=20), server_default='staff', nullable=False))
    
    # Try dropping FKs (names may vary depending on DB driver)
    try:
        op.drop_constraint('messages_expediteurID_fkey', 'messages', type_='foreignkey')
        op.drop_constraint('messages_destinataireID_fkey', 'messages', type_='foreignkey')
    except Exception:
        pass

def downgrade() -> None:
    op.drop_column('messages', 'destinataireType')
    op.drop_column('messages', 'expediteurType')
    
    op.create_foreign_key('messages_expediteurID_fkey', 'messages', 'utilisateurs', ['expediteurID'], ['userID'], ondelete='CASCADE')
    op.create_foreign_key('messages_destinataireID_fkey', 'messages', 'utilisateurs', ['destinataireID'], ['userID'], ondelete='CASCADE')

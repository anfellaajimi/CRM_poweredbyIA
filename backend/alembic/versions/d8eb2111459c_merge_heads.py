"""merge heads

Revision ID: d8eb2111459c
Revises: 20260410_0013, 4da6b436b1e3
Create Date: 2026-04-10 18:44:53.806482
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



revision: str = 'd8eb2111459c'
down_revision: Union[str, None] = ('20260410_0013', '4da6b436b1e3')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

"""merge_auth_and_settings_branches

Revision ID: 82c1783544d6
Revises: 20260504_0016, 8d85577a2d36
Create Date: 2026-05-05 12:07:36.358478
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa



revision: str = '82c1783544d6'
down_revision: Union[str, None] = ('20260504_0016', '8d85577a2d36')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

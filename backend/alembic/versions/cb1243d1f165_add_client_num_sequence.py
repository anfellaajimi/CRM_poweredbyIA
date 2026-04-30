"""add_client_num_sequence

Revision ID: cb1243d1f165
Revises: 58de896e5bcd
Create Date: 2026-04-26 15:58:51.029914
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'cb1243d1f165'
down_revision: Union[str, None] = '58de896e5bcd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add numSequence column
    op.add_column('clients', sa.Column('numSequence', sa.Integer(), nullable=True))
    
    # Populate numSequence for existing clients
    connection = op.get_bind()
    
    # Query all clients ordered by ID
    clients = connection.execute(sa.text('SELECT id, "typeClient" FROM clients ORDER BY id ASC')).fetchall()
    
    # Counters for sequences
    physique_count = 0
    moral_count = 0
    
    for client_id, type_client in clients:
        if str(type_client).lower() == 'physique':
            physique_count += 1
            seq = physique_count
        else:
            moral_count += 1
            seq = moral_count
        
        connection.execute(
            sa.text('UPDATE clients SET "numSequence" = :seq WHERE id = :id'),
            {"seq": seq, "id": client_id}
        )
    
    # Now set it to NOT NULL
    op.alter_column('clients', 'numSequence', nullable=False)


def downgrade() -> None:
    op.drop_column('clients', 'numSequence')

"""project reminders + milestones

Revision ID: 20260330_0010
Revises: 20260330_0009
Create Date: 2026-03-30 13:00:00
"""

from typing import Sequence, Union

from alembic import op


revision: str = "20260330_0010"
down_revision: Union[str, None] = "20260330_0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- rappels extensions (safe to re-run) ---
    op.execute('ALTER TABLE rappels ADD COLUMN IF NOT EXISTS "projetID" INTEGER')
    op.execute('ALTER TABLE rappels ADD COLUMN IF NOT EXISTS "devisID" INTEGER')
    op.execute('ALTER TABLE rappels ADD COLUMN IF NOT EXISTS "factureID" INTEGER')
    op.execute('ALTER TABLE rappels ADD COLUMN IF NOT EXISTS "milestoneID" INTEGER')
    op.execute('ALTER TABLE rappels ADD COLUMN IF NOT EXISTS "systemKey" VARCHAR(255)')
    op.execute('ALTER TABLE rappels ADD COLUMN IF NOT EXISTS "emailSentAt" TIMESTAMP')
    op.execute('ALTER TABLE rappels ADD COLUMN IF NOT EXISTS "emailLastError" TEXT')

    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'fk_rappels_projetID'
            ) THEN
                ALTER TABLE rappels
                ADD CONSTRAINT fk_rappels_projetID
                FOREIGN KEY ("projetID") REFERENCES projets(id) ON DELETE CASCADE;
            END IF;
        END $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'fk_rappels_devisID'
            ) THEN
                ALTER TABLE rappels
                ADD CONSTRAINT fk_rappels_devisID
                FOREIGN KEY ("devisID") REFERENCES devis("devisID") ON DELETE SET NULL;
            END IF;
        END $$;
        """
    )
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'fk_rappels_factureID'
            ) THEN
                ALTER TABLE rappels
                ADD CONSTRAINT fk_rappels_factureID
                FOREIGN KEY ("factureID") REFERENCES factures("factureID") ON DELETE SET NULL;
            END IF;
        END $$;
        """
    )

    op.execute('CREATE INDEX IF NOT EXISTS "ix_rappels_projetID" ON rappels ("projetID")')
    op.execute('CREATE INDEX IF NOT EXISTS "ix_rappels_devisID" ON rappels ("devisID")')
    op.execute('CREATE INDEX IF NOT EXISTS "ix_rappels_factureID" ON rappels ("factureID")')
    op.execute('CREATE INDEX IF NOT EXISTS "ix_rappels_milestoneID" ON rappels ("milestoneID")')
    op.execute(
        'CREATE UNIQUE INDEX IF NOT EXISTS "ux_rappels_systemKey" ON rappels ("systemKey") WHERE "systemKey" IS NOT NULL'
    )

    # --- projet_milestones table ---
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS projet_milestones (
            id SERIAL PRIMARY KEY,
            "projetID" INTEGER NOT NULL REFERENCES projets(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            "dueDate" TIMESTAMP NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'open',
            "completedAt" TIMESTAMP NULL,
            "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
        );
        """
    )
    op.execute('CREATE INDEX IF NOT EXISTS "ix_projet_milestones_id" ON projet_milestones (id)')
    op.execute('CREATE INDEX IF NOT EXISTS "ix_projet_milestones_projetID" ON projet_milestones ("projetID")')
    op.execute('CREATE INDEX IF NOT EXISTS "ix_projet_milestones_dueDate" ON projet_milestones ("dueDate")')
    op.execute('CREATE INDEX IF NOT EXISTS "ix_projet_milestones_status" ON projet_milestones (status)')

    # milestone FK from rappels after table exists
    op.execute(
        """
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'fk_rappels_milestoneID'
            ) THEN
                ALTER TABLE rappels
                ADD CONSTRAINT fk_rappels_milestoneID
                FOREIGN KEY ("milestoneID") REFERENCES projet_milestones(id) ON DELETE SET NULL;
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    raise NotImplementedError("Downgrade is not supported for revision 20260330_0010")


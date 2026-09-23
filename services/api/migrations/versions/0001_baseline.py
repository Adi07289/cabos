"""P1 baseline: an empty schema that every later phase migrates forward from.

Domain tables arrive in P2 (architecture §5). Having a baseline now proves the migration
path works on both SQLite and PostgreSQL from day one.

Revision ID: 0001
Revises:
Create Date: 2026-09-23
"""

from collections.abc import Sequence

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

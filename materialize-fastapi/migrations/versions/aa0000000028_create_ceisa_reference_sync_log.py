"""create ceisa_reference_sync_log table

Revision ID: aa0000000028
Revises: aa0000000027
Create Date: 2026-04-28

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aa0000000028"
down_revision: Union[str, None] = "aa0000000027"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create tabel log sinkronisasi referensi CEISA."""
    op.create_table(
        "ceisa_reference_sync_log",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("reference_slug", sa.String(length=80), nullable=False),
        sa.Column("reference_name", sa.String(length=150), nullable=False),
        sa.Column("status", sa.String(length=30), nullable=False),
        sa.Column("requested_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("inserted_count", sa.Integer(), nullable=True),
        sa.Column("updated_count", sa.Integer(), nullable=True),
        sa.Column("deactivated_count", sa.Integer(), nullable=True),
        sa.Column("total_snapshot", sa.Integer(), nullable=True),
        sa.Column("total_active", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.String(length=500), nullable=True),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index(
        "ix_ceisa_sync_log_reference_slug",
        "ceisa_reference_sync_log",
        ["reference_slug"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_sync_log_status",
        "ceisa_reference_sync_log",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_sync_log_requested_at",
        "ceisa_reference_sync_log",
        ["requested_at"],
        unique=False,
    )


def downgrade() -> None:
    """Drop tabel log sinkronisasi referensi CEISA."""
    op.drop_index("ix_ceisa_sync_log_requested_at", table_name="ceisa_reference_sync_log")
    op.drop_index("ix_ceisa_sync_log_status", table_name="ceisa_reference_sync_log")
    op.drop_index("ix_ceisa_sync_log_reference_slug", table_name="ceisa_reference_sync_log")
    op.drop_table("ceisa_reference_sync_log")

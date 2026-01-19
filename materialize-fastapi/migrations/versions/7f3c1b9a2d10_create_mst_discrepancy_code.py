"""create mst_discrepancy_code (master discrepancy code) + seed data

Revision ID: 7f3c1b9a2d10
Revises: a9c6b5e1d2f3
Create Date: 2026-01-15

"""

from __future__ import annotations

from typing import Sequence, Union
from datetime import datetime

from alembic import op
import sqlalchemy as sa
from migrations.seeders.discrepancyCodeData import DISCREPANCY_CODES


# revision identifiers, used by Alembic.
revision: str = "7f3c1b9a2d10"
down_revision: Union[str, None] = "a9c6b5e1d2f3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- TABLE ---
    op.create_table(
        "mst_discrepancy_code",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.String(length=20), nullable=False, unique=True),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        # severity bisa dipakai untuk prioritas tindakan dan dashboard.
        sa.Column(
            "severity",
            sa.Enum("INFO", "MINOR", "MAJOR", "CRITICAL", name="discrepancy_severity_enum"),
            nullable=False,
            server_default="MAJOR",
        ),
        # hold_delivery=true artinya DOCPROS tidak boleh DLV sebelum discrepancy diselesaikan.
        sa.Column("hold_delivery", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        # require_photo=true cocok untuk DMG/WET/LEK/TAM/ULD-DMG dsb.
        sa.Column("require_photo", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("require_remark", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    op.create_index("ix_mst_discrepancy_code_code", "mst_discrepancy_code", ["code"], unique=True)
    op.create_index(
        "ix_mst_discrepancy_code_category", "mst_discrepancy_code", ["category"], unique=False
    )
    op.create_index(
        "ix_mst_discrepancy_code_severity", "mst_discrepancy_code", ["severity"], unique=False
    )

    # --- SEED DATA ---
    table = sa.table(
        "mst_discrepancy_code",
        sa.column("code", sa.String),
        sa.column("category", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("severity", sa.String),
        sa.column("hold_delivery", sa.Boolean),
        sa.column("require_photo", sa.Boolean),
        sa.column("require_remark", sa.Boolean),
        sa.column("is_active", sa.Boolean),
        sa.column("created_at", sa.DateTime),
    )

    now = datetime.utcnow()

    seed_rows = [{**row, "created_at": now} for row in DISCREPANCY_CODES]

    op.bulk_insert(table, seed_rows)


def downgrade() -> None:
    # drop indexes first
    op.drop_index("ix_mst_discrepancy_code_severity", table_name="mst_discrepancy_code")
    op.drop_index("ix_mst_discrepancy_code_category", table_name="mst_discrepancy_code")
    op.drop_index("ix_mst_discrepancy_code_code", table_name="mst_discrepancy_code")

    # drop table
    op.drop_table("mst_discrepancy_code")

    # drop enum type (important for some DBs; safe to try)
    try:
        op.execute("DROP TYPE discrepancy_severity_enum")
    except Exception:
        # MySQL doesn't use DROP TYPE for ENUM
        pass

"""create mst_ceisa_reference_jenis_nilai + seed data

Revision ID: aa0000000010
Revises: aa000000000f
Create Date: 2026-04-27

"""

from __future__ import annotations

from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from migrations.seeders.ceisaReferenceJenisNilaiData import CEISA_REFERENCE_JENIS_NILAI_CODES

# revision identifiers, used by Alembic.
revision: str = "aa0000000010"
down_revision: Union[str, None] = "aa000000000f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create table mst_ceisa_reference_jenis_nilai dan seed awal data referensi."""
    op.create_table(
        "mst_ceisa_reference_jenis_nilai",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("reference_slug", sa.String(length=80), nullable=False),
        sa.Column("reference_name", sa.String(length=150), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=500), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("last_synced_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        mysql_engine="InnoDB",
    )

    op.create_index(
        "ix_mst_ceisa_reference_jenis_nilai_reference_slug",
        "mst_ceisa_reference_jenis_nilai",
        ["reference_slug"],
        unique=False,
    )
    op.create_index(
        "ix_mst_ceisa_reference_jenis_nilai_code",
        "mst_ceisa_reference_jenis_nilai",
        ["code"],
        unique=False,
    )
    op.create_index(
        "ix_mst_ceisa_reference_jenis_nilai_is_active",
        "mst_ceisa_reference_jenis_nilai",
        ["is_active"],
        unique=False,
    )

    table = sa.table(
        "mst_ceisa_reference_jenis_nilai",
        sa.column("reference_slug", sa.String),
        sa.column("reference_name", sa.String),
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("last_synced_at", sa.DateTime),
        sa.column("created_at", sa.DateTime),
    )

    now = datetime.utcnow()
    seed_rows = [{**row, "last_synced_at": now, "created_at": now} for row in CEISA_REFERENCE_JENIS_NILAI_CODES]
    op.bulk_insert(table, seed_rows)


def downgrade() -> None:
    """Drop table mst_ceisa_reference_jenis_nilai."""
    op.drop_index("ix_mst_ceisa_reference_jenis_nilai_is_active", table_name="mst_ceisa_reference_jenis_nilai")
    op.drop_index("ix_mst_ceisa_reference_jenis_nilai_code", table_name="mst_ceisa_reference_jenis_nilai")
    op.drop_index("ix_mst_ceisa_reference_jenis_nilai_reference_slug", table_name="mst_ceisa_reference_jenis_nilai")
    op.drop_table("mst_ceisa_reference_jenis_nilai")

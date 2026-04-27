"""create mst_ceisa_reference_origin_goods (master data) + seed data

Revision ID: 1b9d5f4e2c7a
Revises: f6a1c4d9e2b7
Create Date: 2026-04-27

"""

from __future__ import annotations

from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from migrations.seeders.ceisaReferenceOriginGoodsData import CEISA_REFERENCE_ORIGIN_GOODS

# revision identifiers, used by Alembic.
revision: str = "1b9d5f4e2c7a"
down_revision: Union[str, None] = "f6a1c4d9e2b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create table dan seed awal referensi asal barang CEISA."""
    op.create_table(
        "mst_ceisa_reference_origin_goods",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.String(length=10), nullable=False, unique=True),
        sa.Column("name", sa.String(length=500), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("source", sa.String(length=30), nullable=False, server_default="CEISA"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("last_synced_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        mysql_engine="InnoDB",
    )

    op.create_index(
        "ix_mst_ceisa_reference_origin_goods_code",
        "mst_ceisa_reference_origin_goods",
        ["code"],
        unique=True,
    )
    op.create_index(
        "ix_mst_ceisa_reference_origin_goods_source",
        "mst_ceisa_reference_origin_goods",
        ["source"],
        unique=False,
    )
    op.create_index(
        "ix_mst_ceisa_reference_origin_goods_is_active",
        "mst_ceisa_reference_origin_goods",
        ["is_active"],
        unique=False,
    )

    table = sa.table(
        "mst_ceisa_reference_origin_goods",
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("source", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("last_synced_at", sa.DateTime),
        sa.column("created_at", sa.DateTime),
    )

    now = datetime.utcnow()
    seed_rows = [{**row, "last_synced_at": now, "created_at": now} for row in CEISA_REFERENCE_ORIGIN_GOODS]
    op.bulk_insert(table, seed_rows)


def downgrade() -> None:
    """Drop table master referensi asal barang CEISA."""
    op.drop_index(
        "ix_mst_ceisa_reference_origin_goods_is_active",
        table_name="mst_ceisa_reference_origin_goods",
    )
    op.drop_index(
        "ix_mst_ceisa_reference_origin_goods_source",
        table_name="mst_ceisa_reference_origin_goods",
    )
    op.drop_index(
        "ix_mst_ceisa_reference_origin_goods_code",
        table_name="mst_ceisa_reference_origin_goods",
    )
    op.drop_table("mst_ceisa_reference_origin_goods")

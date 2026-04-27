"""create mst_ceisa_reference_jenis_transaksi_perdagangan + seed data

Revision ID: aa0000000008
Revises: aa0000000007
Create Date: 2026-04-27

"""

from __future__ import annotations

from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from migrations.seeders.ceisaReferenceJenisTransaksiPerdaganganData import CEISA_REFERENCE_JENIS_TRANSAKSI_PERDAGANGAN_CODES

# revision identifiers, used by Alembic.
revision: str = "aa0000000008"
down_revision: Union[str, None] = "aa0000000007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create table mst_ceisa_reference_jenis_transaksi_perdagangan dan seed awal data referensi."""
    table_name = "mst_ceisa_reference_jenis_transaksi_perdagangan"
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if table_name not in inspector.get_table_names():
        op.create_table(
            table_name,
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
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
        )

    inspector = sa.inspect(bind)
    existing_indexes = {index["name"] for index in inspector.get_indexes(table_name)}
    if "ix_mst_ceisa_reference_jenis_transaksi_perdagangan_rslug" not in existing_indexes:
        op.create_index(
            "ix_mst_ceisa_reference_jenis_transaksi_perdagangan_rslug",
            table_name,
            ["reference_slug"],
            unique=False,
        )
    if "ix_mst_ceisa_reference_jenis_transaksi_perdagangan_code" not in existing_indexes:
        op.create_index(
            "ix_mst_ceisa_reference_jenis_transaksi_perdagangan_code",
            table_name,
            ["code"],
            unique=False,
        )
    if "ix_mst_ceisa_reference_jenis_transaksi_perdagangan_active" not in existing_indexes:
        op.create_index(
            "ix_mst_ceisa_reference_jenis_transaksi_perdagangan_active",
            table_name,
            ["is_active"],
            unique=False,
        )

    table = sa.table(
        table_name,
        sa.column("reference_slug", sa.String),
        sa.column("reference_name", sa.String),
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("last_synced_at", sa.DateTime),
        sa.column("created_at", sa.DateTime),
    )

    has_data = bind.execute(sa.text(f"SELECT 1 FROM {table_name} LIMIT 1")).first()
    if has_data is None:
        now = datetime.utcnow()
        seed_rows = [
            {**row, "last_synced_at": now, "created_at": now}
            for row in CEISA_REFERENCE_JENIS_TRANSAKSI_PERDAGANGAN_CODES
        ]
        op.bulk_insert(table, seed_rows)


def downgrade() -> None:
    """Drop table mst_ceisa_reference_jenis_transaksi_perdagangan."""
    table_name = "mst_ceisa_reference_jenis_transaksi_perdagangan"
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return

    indexes = {index["name"] for index in inspector.get_indexes(table_name)}
    if "ix_mst_ceisa_reference_jenis_transaksi_perdagangan_active" in indexes:
        op.drop_index("ix_mst_ceisa_reference_jenis_transaksi_perdagangan_active", table_name=table_name)
    if "ix_mst_ceisa_reference_jenis_transaksi_perdagangan_code" in indexes:
        op.drop_index("ix_mst_ceisa_reference_jenis_transaksi_perdagangan_code", table_name=table_name)
    if "ix_mst_ceisa_reference_jenis_transaksi_perdagangan_rslug" in indexes:
        op.drop_index("ix_mst_ceisa_reference_jenis_transaksi_perdagangan_rslug", table_name=table_name)
    op.drop_table(table_name)

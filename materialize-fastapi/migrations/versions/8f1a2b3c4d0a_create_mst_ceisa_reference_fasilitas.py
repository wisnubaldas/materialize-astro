"""create mst_ceisa_reference_fasilitas + seed data

Revision ID: 8f1a2b3c4d0a
Revises: 8f1a2b3c4d09
Create Date: 2026-04-27

"""

from __future__ import annotations

from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from migrations.seeders.ceisaReferenceFasilitasData import CEISA_REFERENCE_FASILITAS_CODES

# revision identifiers, used by Alembic.
revision: str = "8f1a2b3c4d0a"
down_revision: Union[str, None] = "8f1a2b3c4d09"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create table mst_ceisa_reference_fasilitas dan seed awal data referensi."""
    op.create_table(
        "mst_ceisa_reference_fasilitas",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("reference_slug", sa.String(length=80), nullable=False),
        sa.Column("reference_name", sa.String(length=150), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=500), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("doc_url", sa.String(length=255), nullable=True),
        sa.Column("source", sa.String(length=30), nullable=False, server_default="CEISA_GITBOOK"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("last_synced_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        mysql_engine="InnoDB",
    )

    op.create_index(
        "ix_mst_ceisa_reference_fasilitas_reference_slug",
        "mst_ceisa_reference_fasilitas",
        ["reference_slug"],
        unique=False,
    )
    op.create_index(
        "ix_mst_ceisa_reference_fasilitas_code",
        "mst_ceisa_reference_fasilitas",
        ["code"],
        unique=False,
    )
    op.create_index(
        "ix_mst_ceisa_reference_fasilitas_is_active",
        "mst_ceisa_reference_fasilitas",
        ["is_active"],
        unique=False,
    )

    table = sa.table(
        "mst_ceisa_reference_fasilitas",
        sa.column("reference_slug", sa.String),
        sa.column("reference_name", sa.String),
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("doc_url", sa.String),
        sa.column("source", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("last_synced_at", sa.DateTime),
        sa.column("created_at", sa.DateTime),
    )

    now = datetime.utcnow()
    seed_rows = [{**row, "last_synced_at": now, "created_at": now} for row in CEISA_REFERENCE_FASILITAS_CODES]
    op.bulk_insert(table, seed_rows)


def downgrade() -> None:
    """Drop table mst_ceisa_reference_fasilitas."""
    op.drop_index("ix_mst_ceisa_reference_fasilitas_is_active", table_name="mst_ceisa_reference_fasilitas")
    op.drop_index("ix_mst_ceisa_reference_fasilitas_code", table_name="mst_ceisa_reference_fasilitas")
    op.drop_index("ix_mst_ceisa_reference_fasilitas_reference_slug", table_name="mst_ceisa_reference_fasilitas")
    op.drop_table("mst_ceisa_reference_fasilitas")

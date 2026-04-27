"""drop legacy mst_ceisa_reference_code table

Revision ID: 9a7b6c5d4e3f
Revises: 8f1a2b3c4d0c
Create Date: 2026-04-27

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9a7b6c5d4e3f"
down_revision: Union[str, None] = "8f1a2b3c4d0c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Drop tabel legacy master referensi CEISA terpusat."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    table_name = "mst_ceisa_reference_code"
    if table_name not in inspector.get_table_names():
        return

    indexes = {index["name"] for index in inspector.get_indexes(table_name)}
    if "ix_mst_ceisa_reference_code_is_active" in indexes:
        op.drop_index("ix_mst_ceisa_reference_code_is_active", table_name=table_name)
    if "ix_mst_ceisa_reference_code_code" in indexes:
        op.drop_index("ix_mst_ceisa_reference_code_code", table_name=table_name)
    if "ix_mst_ceisa_reference_code_reference_slug" in indexes:
        op.drop_index("ix_mst_ceisa_reference_code_reference_slug", table_name=table_name)

    op.drop_table(table_name)


def downgrade() -> None:
    """Recreate tabel legacy jika rollback migration diperlukan."""
    table_name = "mst_ceisa_reference_code"
    op.create_table(
        table_name,
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
        "ix_mst_ceisa_reference_code_reference_slug",
        table_name,
        ["reference_slug"],
        unique=False,
    )
    op.create_index(
        "ix_mst_ceisa_reference_code_code",
        table_name,
        ["code"],
        unique=False,
    )
    op.create_index(
        "ix_mst_ceisa_reference_code_is_active",
        table_name,
        ["is_active"],
        unique=False,
    )

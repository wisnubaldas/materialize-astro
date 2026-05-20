"""add allocation final fields to build_up_check_detail

Revision ID: buc000000005
Revises: buc000000004
Create Date: 2026-05-19

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "buc000000005"
down_revision: str | None = "buc000000004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DETAIL_TABLE = "build_up_check_detail"
ALLOCATION_FINAL_INDEX = "ix_build_up_check_detail_allocation_final"


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def _column_exists(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    return column_name in {column["name"] for column in inspector.get_columns(table_name)}


def _index_exists(table_name: str, index_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    return index_name in {index["name"] for index in inspector.get_indexes(table_name)}


def upgrade() -> None:
    if not _table_exists(DETAIL_TABLE):
        return

    if not _column_exists(DETAIL_TABLE, "is_allocation_final"):
        op.add_column(
            DETAIL_TABLE,
            sa.Column(
                "is_allocation_final",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )

    if not _column_exists(DETAIL_TABLE, "allocation_closed_at"):
        op.add_column(DETAIL_TABLE, sa.Column("allocation_closed_at", sa.TIMESTAMP(), nullable=True))

    if not _index_exists(DETAIL_TABLE, ALLOCATION_FINAL_INDEX):
        op.create_index(
            ALLOCATION_FINAL_INDEX,
            DETAIL_TABLE,
            ["is_allocation_final"],
            unique=False,
        )


def downgrade() -> None:
    if not _table_exists(DETAIL_TABLE):
        return

    if _index_exists(DETAIL_TABLE, ALLOCATION_FINAL_INDEX):
        op.drop_index(ALLOCATION_FINAL_INDEX, table_name=DETAIL_TABLE)

    if _column_exists(DETAIL_TABLE, "allocation_closed_at"):
        op.drop_column(DETAIL_TABLE, "allocation_closed_at")

    if _column_exists(DETAIL_TABLE, "is_allocation_final"):
        op.drop_column(DETAIL_TABLE, "is_allocation_final")

"""add manual close fields to build_up_check_header

Revision ID: buc000000006
Revises: buc000000005
Create Date: 2026-05-29

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "buc000000006"
down_revision: str | None = "buc000000005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

HEADER_TABLE = "build_up_check_header"
CLOSED_INDEX = "ix_build_up_check_header_is_closed"


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
    """Add explicit manual close state for Build Up ULD headers."""
    if not _table_exists(HEADER_TABLE):
        return

    if not _column_exists(HEADER_TABLE, "is_closed"):
        op.add_column(
            HEADER_TABLE,
            sa.Column("is_closed", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        )

    if not _column_exists(HEADER_TABLE, "closed_at"):
        op.add_column(HEADER_TABLE, sa.Column("closed_at", sa.TIMESTAMP(), nullable=True))

    if not _index_exists(HEADER_TABLE, CLOSED_INDEX):
        op.create_index(CLOSED_INDEX, HEADER_TABLE, ["is_closed"], unique=False)


def downgrade() -> None:
    """Remove explicit manual close state from Build Up ULD headers."""
    if not _table_exists(HEADER_TABLE):
        return

    if _index_exists(HEADER_TABLE, CLOSED_INDEX):
        op.drop_index(CLOSED_INDEX, table_name=HEADER_TABLE)

    if _column_exists(HEADER_TABLE, "closed_at"):
        op.drop_column(HEADER_TABLE, "closed_at")

    if _column_exists(HEADER_TABLE, "is_closed"):
        op.drop_column(HEADER_TABLE, "is_closed")

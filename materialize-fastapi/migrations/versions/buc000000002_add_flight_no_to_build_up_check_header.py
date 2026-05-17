"""add flight_no to build_up_check_header

Revision ID: buc000000002
Revises: buc000000001
Create Date: 2026-05-17

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "buc000000002"
down_revision: str | None = "buc000000001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

HEADER_TABLE = "build_up_check_header"
FLIGHT_NO_INDEX = "ix_build_up_check_header_flight_no"


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
    if not _table_exists(HEADER_TABLE):
        return

    if not _column_exists(HEADER_TABLE, "flight_no"):
        op.add_column(HEADER_TABLE, sa.Column("flight_no", sa.String(length=50), nullable=True))

    if not _index_exists(HEADER_TABLE, FLIGHT_NO_INDEX):
        op.create_index(FLIGHT_NO_INDEX, HEADER_TABLE, ["flight_no"], unique=False)


def downgrade() -> None:
    if not _table_exists(HEADER_TABLE):
        return

    if _index_exists(HEADER_TABLE, FLIGHT_NO_INDEX):
        op.drop_index(FLIGHT_NO_INDEX, table_name=HEADER_TABLE)

    if _column_exists(HEADER_TABLE, "flight_no"):
        op.drop_column(HEADER_TABLE, "flight_no")

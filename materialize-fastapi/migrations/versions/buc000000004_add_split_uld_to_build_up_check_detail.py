"""add split uld metadata to build_up_check_detail

Revision ID: buc000000004
Revises: buc000000003
Create Date: 2026-05-18

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "buc000000004"
down_revision: str | None = "buc000000003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DETAIL_TABLE = "build_up_check_detail"
SPLIT_GROUP_INDEX = "ix_build_up_check_detail_split_group"
MAWB_HEADER_INDEX = "ix_build_up_check_detail_mawb_header"


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

    if not _column_exists(DETAIL_TABLE, "master_total_pieces"):
        op.add_column(DETAIL_TABLE, sa.Column("master_total_pieces", sa.Integer(), nullable=True))

    if not _column_exists(DETAIL_TABLE, "split_group_key"):
        op.add_column(DETAIL_TABLE, sa.Column("split_group_key", sa.String(length=150), nullable=True))

    if not _column_exists(DETAIL_TABLE, "split_sequence"):
        op.add_column(DETAIL_TABLE, sa.Column("split_sequence", sa.SmallInteger(), nullable=True))

    if not _column_exists(DETAIL_TABLE, "split_total_uld"):
        op.add_column(
            DETAIL_TABLE,
            sa.Column(
                "split_total_uld",
                sa.SmallInteger(),
                nullable=False,
                server_default=sa.text("1"),
            ),
        )

    if not _column_exists(DETAIL_TABLE, "is_split_uld"):
        op.add_column(
            DETAIL_TABLE,
            sa.Column(
                "is_split_uld",
                sa.Boolean(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )

    if not _index_exists(DETAIL_TABLE, SPLIT_GROUP_INDEX):
        op.create_index(SPLIT_GROUP_INDEX, DETAIL_TABLE, ["split_group_key"], unique=False)

    if not _index_exists(DETAIL_TABLE, MAWB_HEADER_INDEX):
        op.create_index(MAWB_HEADER_INDEX, DETAIL_TABLE, ["mawb", "header_id"], unique=False)


def downgrade() -> None:
    if not _table_exists(DETAIL_TABLE):
        return

    if _index_exists(DETAIL_TABLE, MAWB_HEADER_INDEX):
        op.drop_index(MAWB_HEADER_INDEX, table_name=DETAIL_TABLE)

    if _index_exists(DETAIL_TABLE, SPLIT_GROUP_INDEX):
        op.drop_index(SPLIT_GROUP_INDEX, table_name=DETAIL_TABLE)

    for column_name in (
        "is_split_uld",
        "split_total_uld",
        "split_sequence",
        "split_group_key",
        "master_total_pieces",
    ):
        if _column_exists(DETAIL_TABLE, column_name):
            op.drop_column(DETAIL_TABLE, column_name)

"""add status to build_up_check_detail

Revision ID: buc000000003
Revises: buc000000002
Create Date: 2026-05-17

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "buc000000003"
down_revision: str | None = "buc000000002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

DETAIL_TABLE = "build_up_check_detail"
STATUS_INDEX = "ix_build_up_check_detail_status"


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

    if not _column_exists(DETAIL_TABLE, "status"):
        op.add_column(
            DETAIL_TABLE,
            sa.Column(
                "status",
                sa.Integer(),
                nullable=False,
                server_default=sa.text("0"),
            ),
        )

    if not _index_exists(DETAIL_TABLE, STATUS_INDEX):
        op.create_index(STATUS_INDEX, DETAIL_TABLE, ["status"], unique=False)

    op.execute(
        sa.text(
            """
            UPDATE build_up_check_detail AS detail
            SET detail.status = 1
            WHERE detail.total_pieces > 0
              AND (
                SELECT COALESCE(SUM(rincian.pieces), 0)
                FROM build_up_check_rincian AS rincian
                WHERE rincian.check_detail_id = detail.id
              ) >= detail.total_pieces
            """
        )
    )


def downgrade() -> None:
    if not _table_exists(DETAIL_TABLE):
        return

    if _index_exists(DETAIL_TABLE, STATUS_INDEX):
        op.drop_index(STATUS_INDEX, table_name=DETAIL_TABLE)

    if _column_exists(DETAIL_TABLE, "status"):
        op.drop_column(DETAIL_TABLE, "status")

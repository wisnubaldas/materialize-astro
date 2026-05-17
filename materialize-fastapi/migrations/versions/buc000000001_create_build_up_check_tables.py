"""create build_up_check tables

Revision ID: buc000000001
Revises: bud000000001
Create Date: 2026-05-15

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "buc000000001"
down_revision: str | None = "bud000000001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

HEADER_TABLE = "build_up_check_header"
DETAIL_TABLE = "build_up_check_detail"
RINCIAN_TABLE = "build_up_check_rincian"


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def _drop_index_if_exists(index_name: str, table_name: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return
    indexes = {index["name"] for index in inspector.get_indexes(table_name)}
    if index_name in indexes:
        op.drop_index(index_name, table_name=table_name)


def upgrade() -> None:
    if not _table_exists(HEADER_TABLE):
        op.create_table(
            HEADER_TABLE,
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column("uld", sa.String(length=100), nullable=False),
            sa.Column("airlines", sa.String(length=50), nullable=True),
            sa.Column("dest", sa.String(length=50), nullable=True),
            sa.Column("flight_date", sa.Date(), nullable=True),
            sa.Column("staff", sa.String(length=100), nullable=True),
            sa.Column("supervisor", sa.String(length=100), nullable=True),
            sa.Column(
                "created_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            sa.Column(
                "updated_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
                server_onupdate=sa.text("CURRENT_TIMESTAMP"),
            ),
            mysql_engine="InnoDB",
        )
        op.create_index("ix_build_up_check_header_uld", HEADER_TABLE, ["uld"], unique=False)
        op.create_index(
            "ix_build_up_check_header_flight_date",
            HEADER_TABLE,
            ["flight_date"],
            unique=False,
        )

    if not _table_exists(DETAIL_TABLE):
        op.create_table(
            DETAIL_TABLE,
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column(
                "header_id",
                sa.BigInteger(),
                sa.ForeignKey(f"{HEADER_TABLE}.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("mawb", sa.String(length=100), nullable=True),
            sa.Column("total_pieces", sa.Integer(), nullable=True),
            sa.Column("agent", sa.String(length=100), nullable=True),
            sa.Column("remark", sa.Text(), nullable=True),
            sa.Column(
                "created_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            sa.Column(
                "updated_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
                server_onupdate=sa.text("CURRENT_TIMESTAMP"),
            ),
            mysql_engine="InnoDB",
        )
        op.create_index(
            "ix_build_up_check_detail_header_id",
            DETAIL_TABLE,
            ["header_id"],
            unique=False,
        )
        op.create_index("ix_build_up_check_detail_mawb", DETAIL_TABLE, ["mawb"], unique=False)

    if not _table_exists(RINCIAN_TABLE):
        op.create_table(
            RINCIAN_TABLE,
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column(
                "check_detail_id",
                sa.BigInteger(),
                sa.ForeignKey(f"{DETAIL_TABLE}.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("pieces", sa.Integer(), nullable=True),
            sa.Column("weight", sa.Float(), nullable=True),
            sa.Column(
                "created_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            sa.Column(
                "updated_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
                server_onupdate=sa.text("CURRENT_TIMESTAMP"),
            ),
            mysql_engine="InnoDB",
        )
        op.create_index(
            "ix_build_up_check_rincian_check_detail_id",
            RINCIAN_TABLE,
            ["check_detail_id"],
            unique=False,
        )


def downgrade() -> None:
    _drop_index_if_exists("ix_build_up_check_rincian_check_detail_id", RINCIAN_TABLE)
    if _table_exists(RINCIAN_TABLE):
        op.drop_table(RINCIAN_TABLE)

    _drop_index_if_exists("ix_build_up_check_detail_mawb", DETAIL_TABLE)
    _drop_index_if_exists("ix_build_up_check_detail_header_id", DETAIL_TABLE)
    if _table_exists(DETAIL_TABLE):
        op.drop_table(DETAIL_TABLE)

    _drop_index_if_exists("ix_build_up_check_header_flight_date", HEADER_TABLE)
    _drop_index_if_exists("ix_build_up_check_header_uld", HEADER_TABLE)
    if _table_exists(HEADER_TABLE):
        op.drop_table(HEADER_TABLE)

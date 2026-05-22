"""drop legacy warehouse buildup tables

Revision ID: bul000000001
Revises: buc000000005
Create Date: 2026-05-21

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "bul000000001"
down_revision: str | None = "buc000000005"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _table_exists(table_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def _drop_table_if_exists(table_name: str) -> None:
    if _table_exists(table_name):
        op.drop_table(table_name)


def upgrade() -> None:
    """Drop legacy Warehouse Buildup tables after FFM moved to Build Up Check."""
    _drop_table_if_exists("build_up_dead_stock")
    _drop_table_if_exists("build_up_detail")
    _drop_table_if_exists("build_up_header")
    _drop_table_if_exists("build_up_draft")


def downgrade() -> None:
    """Recreate legacy tables for rollback only; dropped data is not restored."""
    if not _table_exists("build_up_header"):
        op.create_table(
            "build_up_header",
            sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column("number_build_up", sa.String(length=100), nullable=False),
            sa.Column("airlines_code", sa.String(length=50), nullable=True),
            sa.Column("origin", sa.String(length=50), nullable=True),
            sa.Column("dest", sa.String(length=50), nullable=True),
            sa.Column("flight_date", sa.Date(), nullable=True),
            sa.Column("for_official_use", sa.String(length=255), nullable=True),
            sa.Column("total_pieces", sa.Integer(), nullable=True),
            sa.Column("total_weight", sa.Float(), nullable=True),
            sa.Column("total_volume", sa.Float(), nullable=True),
            sa.Column("pdf_link", sa.String(length=255), nullable=True),
            sa.Column("create_at", sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
            sa.Column(
                "update_at",
                sa.TIMESTAMP(),
                server_default=sa.func.now(),
                onupdate=sa.func.now(),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            "ix_build_up_header_number_build_up",
            "build_up_header",
            ["number_build_up"],
            unique=False,
        )
        op.create_index(
            "ix_build_up_header_flight_date",
            "build_up_header",
            ["flight_date"],
            unique=False,
        )

    if not _table_exists("build_up_detail"):
        op.create_table(
            "build_up_detail",
            sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column("header_id", sa.BigInteger(), nullable=False),
            sa.Column("mawb", sa.String(length=100), nullable=True),
            sa.Column("uld_number", sa.String(length=50), nullable=True),
            sa.Column("uld_type", sa.String(length=50), nullable=True),
            sa.Column("pieces", sa.Integer(), nullable=True),
            sa.Column("weight", sa.Float(), nullable=True),
            sa.Column("volume", sa.Float(), nullable=True),
            sa.Column("nature_of_goods", sa.Text(), nullable=True),
            sa.Column("remark", sa.Text(), nullable=True),
            sa.Column("create_at", sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["header_id"], ["build_up_header.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_build_up_detail_header_id", "build_up_detail", ["header_id"])
        op.create_index("ix_build_up_detail_mawb", "build_up_detail", ["mawb"])

    if not _table_exists("build_up_dead_stock"):
        op.create_table(
            "build_up_dead_stock",
            sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column("build_up_detail_id", sa.BigInteger(), nullable=True),
            sa.Column("mawb", sa.String(length=100), nullable=False),
            sa.Column("pieces", sa.Integer(), nullable=True),
            sa.Column("weight", sa.Float(), nullable=True),
            sa.Column("create_at", sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
            sa.Column(
                "update_at",
                sa.TIMESTAMP(),
                server_default=sa.func.now(),
                onupdate=sa.func.now(),
                nullable=False,
            ),
            sa.ForeignKeyConstraint(
                ["build_up_detail_id"],
                ["build_up_detail.id"],
                ondelete="SET NULL",
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index(
            "ix_build_up_dead_stock_build_up_detail_id",
            "build_up_dead_stock",
            ["build_up_detail_id"],
        )
        op.create_index("ix_build_up_dead_stock_mawb", "build_up_dead_stock", ["mawb"])

    if not _table_exists("build_up_draft"):
        op.create_table(
            "build_up_draft",
            sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
            sa.Column("rows", sa.JSON(), nullable=False),
            sa.Column("payload", sa.JSON(), nullable=True),
            sa.Column("ignored", sa.JSON(), nullable=True),
            sa.Column("master_awbs", sa.JSON(), nullable=True),
            sa.Column("create_at", sa.TIMESTAMP(), server_default=sa.func.now(), nullable=False),
            sa.Column(
                "update_at",
                sa.TIMESTAMP(),
                server_default=sa.func.now(),
                onupdate=sa.func.now(),
                nullable=False,
            ),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_build_up_draft_create_at", "build_up_draft", ["create_at"])
        op.create_index("ix_build_up_draft_update_at", "build_up_draft", ["update_at"])

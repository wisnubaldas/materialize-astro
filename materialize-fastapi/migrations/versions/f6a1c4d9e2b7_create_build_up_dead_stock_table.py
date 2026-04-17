"""create build_up_dead_stock table

Revision ID: f6a1c4d9e2b7
Revises: b9c3e7f1a2d4
Create Date: 2026-04-17 16:05:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "f6a1c4d9e2b7"
down_revision: Union[str, None] = "b9c3e7f1a2d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _drop_index_if_exists(index_name: str, table_name: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return
    indexes = {index["name"] for index in inspector.get_indexes(table_name)}
    if index_name in indexes:
        op.drop_index(index_name, table_name=table_name)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "build_up_dead_stock" not in tables:
        op.create_table(
            "build_up_dead_stock",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column(
                "build_up_detail_id",
                sa.BigInteger(),
                sa.ForeignKey("build_up_detail.id", ondelete="SET NULL"),
                nullable=True,
            ),
            sa.Column("mawb", sa.String(length=100), nullable=False),
            sa.Column("pieces", sa.Integer(), nullable=True),
            sa.Column("weight", sa.Float(), nullable=True),
            sa.Column(
                "create_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            sa.Column(
                "update_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
                server_onupdate=sa.text("CURRENT_TIMESTAMP"),
            ),
            mysql_engine="InnoDB",
        )
        op.create_index(
            "ix_build_up_dead_stock_build_up_detail_id",
            "build_up_dead_stock",
            ["build_up_detail_id"],
            unique=False,
        )
        op.create_index(
            "ix_build_up_dead_stock_mawb",
            "build_up_dead_stock",
            ["mawb"],
            unique=False,
        )


def downgrade() -> None:
    _drop_index_if_exists("ix_build_up_dead_stock_mawb", "build_up_dead_stock")
    _drop_index_if_exists(
        "ix_build_up_dead_stock_build_up_detail_id",
        "build_up_dead_stock",
    )

    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "build_up_dead_stock" in inspector.get_table_names():
        op.drop_table("build_up_dead_stock")

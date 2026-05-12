"""create build_up_draft table

Revision ID: bud000000001
Revises: 8c1addb3c06c
Create Date: 2026-05-12

"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "bud000000001"
down_revision: str | None = "8c1addb3c06c"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLE_NAME = "build_up_draft"


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
    if _table_exists(TABLE_NAME):
        return

    op.create_table(
        TABLE_NAME,
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("rows", sa.JSON(), nullable=False),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("ignored", sa.JSON(), nullable=True),
        sa.Column("master_awbs", sa.JSON(), nullable=True),
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
    op.create_index("ix_build_up_draft_create_at", TABLE_NAME, ["create_at"], unique=False)
    op.create_index("ix_build_up_draft_update_at", TABLE_NAME, ["update_at"], unique=False)


def downgrade() -> None:
    _drop_index_if_exists("ix_build_up_draft_update_at", TABLE_NAME)
    _drop_index_if_exists("ix_build_up_draft_create_at", TABLE_NAME)
    if _table_exists(TABLE_NAME):
        op.drop_table(TABLE_NAME)

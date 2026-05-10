"""add volume columns to build up header/detail

Revision ID: aa0000000032
Revises: aa0000000031
Create Date: 2026-05-10

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aa0000000032"
down_revision: Union[str, None] = "aa0000000031"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return False
    columns = {column["name"] for column in inspector.get_columns(table_name)}
    return column_name in columns


def upgrade() -> None:
    if not _table_has_column("build_up_header", "total_volume"):
        op.add_column("build_up_header", sa.Column("total_volume", sa.Float(), nullable=True))

    if not _table_has_column("build_up_detail", "volume"):
        op.add_column("build_up_detail", sa.Column("volume", sa.Float(), nullable=True))


def downgrade() -> None:
    if _table_has_column("build_up_detail", "volume"):
        op.drop_column("build_up_detail", "volume")

    if _table_has_column("build_up_header", "total_volume"):
        op.drop_column("build_up_header", "total_volume")


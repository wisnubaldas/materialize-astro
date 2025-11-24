"""add menus and user_roles tables

Revision ID: 9c48da8d57fc
Revises: c747e4c40d64
Create Date: 2025-11-24 17:03:08.053963

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9c48da8d57fc"
down_revision: Union[str, None] = "0c7b63a29fdc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # 1. Buat table user_roles
    op.create_table(
        "user_roles",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("role_name", sa.String(100), unique=True, nullable=False),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )
    # 2. Buat table menus
    op.create_table(
        "menus",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("icon", sa.String(100), nullable=False),
        sa.Column("parent", sa.Integer(), nullable=False, default=0, index=True),
        sa.Column("url", sa.String(255), nullable=False),
        sa.Column("role_id", sa.Integer, sa.ForeignKey("user_roles.id"), index=True),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
    )

    pass


def downgrade() -> None:
    """Downgrade schema."""
    # rollback
    op.drop_table("menus")
    op.drop_table("user_roles")
    pass

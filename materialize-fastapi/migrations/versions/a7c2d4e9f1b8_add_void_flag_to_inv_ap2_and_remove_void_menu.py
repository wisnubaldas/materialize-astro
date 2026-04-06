"""add void flag to inv_ap2 and remove legacy void menu

Revision ID: a7c2d4e9f1b8
Revises: 9f7e1c2d4b6a
Create Date: 2026-04-06

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "a7c2d4e9f1b8"
down_revision: Union[str, None] = "9f7e1c2d4b6a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return inspector.has_table(table_name)


def _column_exists(table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table(table_name):
        return False

    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    conn = op.get_bind()

    if _table_exists("inv_ap2") and not _column_exists("inv_ap2", "void"):
        op.add_column(
            "inv_ap2",
            sa.Column("void", sa.SmallInteger(), nullable=False, server_default=sa.text("0")),
        )

    if _table_exists("menus"):
        conn.execute(
            sa.text(
                "DELETE FROM menus WHERE url = :url OR (name = :name AND url = :url)"
            ),
            {"name": "Void Invoice", "url": "/angkasapura/void-invoice"},
        )


def downgrade() -> None:
    conn = op.get_bind()

    if _table_exists("menus"):
        exists = conn.execute(
            sa.text("SELECT id FROM menus WHERE url = :url LIMIT 1"),
            {"url": "/angkasapura/void-invoice"},
        ).scalar()
        if not exists:
            parent_id = conn.execute(
                sa.text(
                    "SELECT id FROM menus WHERE name = :name AND parent = 0 ORDER BY id ASC LIMIT 1"
                ),
                {"name": "Angkasapura"},
            ).scalar()
            if parent_id:
                conn.execute(
                    sa.text(
                        "INSERT INTO menus (name, icon, parent, url, role_id, created_at) "
                        "VALUES (:name, :icon, :parent, :url, NULL, NOW())"
                    ),
                    {
                        "name": "Void Invoice",
                        "icon": "",
                        "parent": int(parent_id),
                        "url": "/angkasapura/void-invoice",
                    },
                )

    if _table_exists("inv_ap2") and _column_exists("inv_ap2", "void"):
        op.drop_column("inv_ap2", "void")

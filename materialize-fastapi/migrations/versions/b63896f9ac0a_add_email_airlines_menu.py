"""add_email_airlines_menu

Revision ID: b63896f9ac0a
Revises: bul000000001
Create Date: 2026-05-23 01:23:37.986163

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b63896f9ac0a'
down_revision: Union[str, None] = 'bul000000001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_menu_id(conn, name: str, parent: int = 0) -> int | None:
    row = conn.execute(
        sa.text("SELECT id FROM menus WHERE name = :name AND parent = :parent ORDER BY id ASC LIMIT 1"),
        {"name": name, "parent": parent},
    ).first()
    return row[0] if row else None


def _menu_exists(conn, name: str, url: str, parent: int) -> bool:
    row = conn.execute(
        sa.text("SELECT id FROM menus WHERE url = :url AND parent = :parent LIMIT 1"),
        {"url": url, "parent": parent},
    ).first()
    if row:
        return True
    row = conn.execute(
        sa.text("SELECT id FROM menus WHERE name = :name AND parent = :parent LIMIT 1"),
        {"name": name, "parent": parent},
    ).first()
    return bool(row)


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()
    edi_id = _get_menu_id(conn, "EDI", 0) or 39
    master_edi_id = _get_menu_id(conn, "Master EDI", edi_id) or 49

    if not _menu_exists(conn, "Email Airlines", "/edi/email-airlines", master_edi_id):
        conn.execute(
            sa.text(
                "INSERT INTO menus (name, icon, parent, url, role_id, created_at) "
                "VALUES (:name, :icon, :parent, :url, NULL, NOW())"
            ),
            {
                "name": "Email Airlines",
                "icon": "",
                "parent": master_edi_id,
                "url": "/edi/email-airlines",
            },
        )


def downgrade() -> None:
    """Downgrade schema."""
    conn = op.get_bind()
    conn.execute(
        sa.text("DELETE FROM menus WHERE url = :url"),
        {"url": "/edi/email-airlines"},
    )

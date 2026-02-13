"""add master discrepancy code & fsu message menus under EDI

Revision ID: f2a1b3c4d5e6
Revises: 7f3c1b9a2d10
Create Date: 2026-02-05 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
from sqlalchemy import bindparam, text

# revision identifiers, used by Alembic.
revision: str = "f2a1b3c4d5e6"
down_revision: Union[str, None] = "7f3c1b9a2d10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_menu_id(conn, name: str, parent: int = 0) -> int | None:
    row = conn.execute(
        text("SELECT id FROM menus WHERE name = :name AND parent = :parent ORDER BY id ASC LIMIT 1"),
        {"name": name, "parent": parent},
    ).first()
    return row[0] if row else None


def _menu_exists(conn, name: str, url: str, parent: int) -> bool:
    row = conn.execute(
        text("SELECT id FROM menus WHERE url = :url AND parent = :parent LIMIT 1"),
        {"url": url, "parent": parent},
    ).first()
    if row:
        return True
    row = conn.execute(
        text("SELECT id FROM menus WHERE name = :name AND parent = :parent LIMIT 1"),
        {"name": name, "parent": parent},
    ).first()
    return bool(row)


def upgrade() -> None:
    conn = op.get_bind()
    edi_id = _get_menu_id(conn, "EDI", 0)

    if not edi_id:
        conn.execute(
            text(
                "INSERT INTO menus (name, icon, parent, url, role_id, created_at) "
                "VALUES (:name, :icon, 0, :url, NULL, NOW())"
            ),
            {
                "name": "EDI",
                "icon": "ri ri-barcode-line",
                "url": "javascript:void(0)",
            },
        )
        edi_id = _get_menu_id(conn, "EDI", 0)

    if not edi_id:
        return

    new_menus = [
        {
            "name": "Master Discrepancy Code",
            "url": "/edi/discrepancy-code",
            "icon": "",
            "parent": edi_id,
        },
        {
            "name": "Master FSU Message",
            "url": "/edi/fsu-message",
            "icon": "",
            "parent": edi_id,
        },
    ]

    for menu in new_menus:
        if _menu_exists(conn, menu["name"], menu["url"], menu["parent"]):
            continue
        conn.execute(
            text(
                "INSERT INTO menus (name, icon, parent, url, role_id, created_at) "
                "VALUES (:name, :icon, :parent, :url, NULL, NOW())"
            ),
            menu,
        )


def downgrade() -> None:
    conn = op.get_bind()
    urls = ["/edi/discrepancy-code", "/edi/fsu-message"]
    conn.execute(
        text("DELETE FROM menus WHERE url IN :urls").bindparams(bindparam("urls", expanding=True)),
        {"urls": urls},
    )

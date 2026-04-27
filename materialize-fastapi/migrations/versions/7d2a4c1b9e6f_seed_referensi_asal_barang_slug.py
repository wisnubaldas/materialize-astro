"""seed referensi-asal-barang slug on mst_ceisa_reference_code

Revision ID: 7d2a4c1b9e6f
Revises: 3c9f5a1e7b2d
Create Date: 2026-04-27

"""

from __future__ import annotations

from datetime import datetime
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from migrations.seeders.ceisaReferenceCodeData import CEISA_REFERENCE_CODES

# revision identifiers, used by Alembic.
revision: str = "7d2a4c1b9e6f"
down_revision: Union[str, None] = "3c9f5a1e7b2d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Insert data referensi-asal-barang jika belum tersedia."""
    target_rows = [
        row for row in CEISA_REFERENCE_CODES if row.get("reference_slug") == "referensi-asal-barang"
    ]
    if not target_rows:
        return

    bind = op.get_bind()
    now = datetime.utcnow()
    rows_to_insert: list[dict[str, object]] = []

    for row in target_rows:
        exists = bind.execute(
            sa.text(
                """
                SELECT 1
                FROM mst_ceisa_reference_code
                WHERE reference_slug = :reference_slug
                  AND code = :code
                  AND name = :name
                LIMIT 1
                """
            ),
            {
                "reference_slug": row["reference_slug"],
                "code": row["code"],
                "name": row["name"],
            },
        ).first()
        if exists:
            continue

        rows_to_insert.append(
            {
                "reference_slug": row["reference_slug"],
                "reference_name": row["reference_name"],
                "code": row["code"],
                "name": row["name"],
                "description": row.get("description"),
                "doc_url": row.get("doc_url"),
                "source": row.get("source", "CEISA_GITBOOK"),
                "is_active": bool(row.get("is_active", True)),
                "last_synced_at": now,
                "created_at": now,
            }
        )

    if not rows_to_insert:
        return

    table = sa.table(
        "mst_ceisa_reference_code",
        sa.column("reference_slug", sa.String),
        sa.column("reference_name", sa.String),
        sa.column("code", sa.String),
        sa.column("name", sa.String),
        sa.column("description", sa.String),
        sa.column("doc_url", sa.String),
        sa.column("source", sa.String),
        sa.column("is_active", sa.Boolean),
        sa.column("last_synced_at", sa.DateTime),
        sa.column("created_at", sa.DateTime),
    )
    op.bulk_insert(table, rows_to_insert)


def downgrade() -> None:
    """Hapus data referensi-asal-barang yang diinsert migration ini."""
    bind = op.get_bind()
    bind.execute(
        sa.text(
            "DELETE FROM mst_ceisa_reference_code WHERE reference_slug = :reference_slug"
        ),
        {"reference_slug": "referensi-asal-barang"},
    )

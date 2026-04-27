"""remove doc_url and source columns from split ceisa reference tables

Revision ID: aa0000000000
Revises: 9a7b6c5d4e3f
Create Date: 2026-04-27

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aa0000000000"
down_revision: Union[str, None] = "9a7b6c5d4e3f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABLE_NAMES = ['mst_ceisa_reference_asal_barang',
 'mst_ceisa_reference_asal_barang_ftz',
 'mst_ceisa_reference_bank',
 'mst_ceisa_reference_cara_angkut',
 'mst_ceisa_reference_cara_bayar',
 'mst_ceisa_reference_cara_dagang',
 'mst_ceisa_reference_daerah_asal',
 'mst_ceisa_reference_dokumen',
 'mst_ceisa_reference_entitas',
 'mst_ceisa_reference_fasilitas',
 'mst_ceisa_reference_fasilitas_tarif',
 'mst_ceisa_reference_ijin',
 'mst_ceisa_reference_origin_goods']


def upgrade() -> None:
    """Drop kolom doc_url dan source dari tabel referensi CEISA hasil split."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    table_names = set(inspector.get_table_names())

    for table_name in TABLE_NAMES:
        if table_name not in table_names:
            continue
        columns = {column["name"] for column in inspector.get_columns(table_name)}
        if "doc_url" in columns:
            op.drop_column(table_name, "doc_url")
        if "source" in columns:
            op.drop_column(table_name, "source")


def downgrade() -> None:
    """Kembalikan kolom doc_url dan source jika rollback dibutuhkan."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    table_names = set(inspector.get_table_names())

    for table_name in TABLE_NAMES:
        if table_name not in table_names:
            continue
        columns = {column["name"] for column in inspector.get_columns(table_name)}
        if "source" not in columns:
            op.add_column(
                table_name,
                sa.Column(
                    "source",
                    sa.String(length=30),
                    nullable=False,
                    server_default="CEISA_GITBOOK",
                ),
            )
        if "doc_url" not in columns:
            op.add_column(
                table_name,
                sa.Column("doc_url", sa.String(length=255), nullable=True),
            )

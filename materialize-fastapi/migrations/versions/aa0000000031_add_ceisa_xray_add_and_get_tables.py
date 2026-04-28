"""add operation type and get request table for ceisa xray

Revision ID: aa0000000031
Revises: aa0000000030
Create Date: 2026-04-28

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aa0000000031"
down_revision: Union[str, None] = "aa0000000030"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Tambah kolom operation type dan tabel queue get foto X-Ray."""
    op.add_column(
        "ceisa_xray_photo_request",
        sa.Column("operation_type", sa.String(length=20), nullable=False, server_default="KIRIM"),
    )
    op.create_index(
        "ix_ceisa_xray_request_operation_type",
        "ceisa_xray_photo_request",
        ["operation_type"],
        unique=False,
    )

    op.create_table(
        "ceisa_xray_photo_get_request",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("nomor_aju", sa.String(length=80), nullable=True),
        sa.Column("nomor_bl_awb", sa.String(length=80), nullable=True),
        sa.Column("tanggal_bl_awb", sa.Date(), nullable=True),
        sa.Column("kode_kantor", sa.String(length=20), nullable=True),
        sa.Column("status", sa.String(length=30), nullable=False, server_default="QUEUED"),
        sa.Column("requested_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("finished_at", sa.DateTime(), nullable=True),
        sa.Column("ceisa_response_code", sa.Integer(), nullable=True),
        sa.Column("ceisa_response_message", sa.String(length=500), nullable=True),
        sa.Column("ceisa_response_payload", sa.Text(), nullable=True),
        sa.Column("error_message", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index(
        "ix_ceisa_xray_get_request_nomor_aju",
        "ceisa_xray_photo_get_request",
        ["nomor_aju"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_xray_get_request_nomor_bl_awb",
        "ceisa_xray_photo_get_request",
        ["nomor_bl_awb"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_xray_get_request_tanggal_bl_awb",
        "ceisa_xray_photo_get_request",
        ["tanggal_bl_awb"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_xray_get_request_kode_kantor",
        "ceisa_xray_photo_get_request",
        ["kode_kantor"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_xray_get_request_status",
        "ceisa_xray_photo_get_request",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_xray_get_request_requested_at",
        "ceisa_xray_photo_get_request",
        ["requested_at"],
        unique=False,
    )


def downgrade() -> None:
    """Rollback perubahan queue add/get foto X-Ray."""
    op.drop_index("ix_ceisa_xray_get_request_requested_at", table_name="ceisa_xray_photo_get_request")
    op.drop_index("ix_ceisa_xray_get_request_status", table_name="ceisa_xray_photo_get_request")
    op.drop_index("ix_ceisa_xray_get_request_kode_kantor", table_name="ceisa_xray_photo_get_request")
    op.drop_index(
        "ix_ceisa_xray_get_request_tanggal_bl_awb",
        table_name="ceisa_xray_photo_get_request",
    )
    op.drop_index("ix_ceisa_xray_get_request_nomor_bl_awb", table_name="ceisa_xray_photo_get_request")
    op.drop_index("ix_ceisa_xray_get_request_nomor_aju", table_name="ceisa_xray_photo_get_request")
    op.drop_table("ceisa_xray_photo_get_request")

    op.drop_index(
        "ix_ceisa_xray_request_operation_type",
        table_name="ceisa_xray_photo_request",
    )
    op.drop_column("ceisa_xray_photo_request", "operation_type")


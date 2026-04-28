"""create ceisa_request_log and ceisa_webhook_log tables

Revision ID: aa0000000029
Revises: aa0000000028
Create Date: 2026-04-28

"""

from __future__ import annotations

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "aa0000000029"
down_revision: Union[str, None] = "aa0000000028"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Create tabel transaksi log request dan webhook CEISA."""
    op.create_table(
        "ceisa_request_log",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("request_id", sa.String(length=100), nullable=True),
        sa.Column("service_name", sa.String(length=100), nullable=False),
        sa.Column("endpoint_path", sa.String(length=255), nullable=False),
        sa.Column("http_method", sa.String(length=10), nullable=False),
        sa.Column("request_headers", sa.Text(), nullable=True),
        sa.Column("request_payload", sa.Text(), nullable=True),
        sa.Column("request_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("response_status_code", sa.Integer(), nullable=True),
        sa.Column("response_headers", sa.Text(), nullable=True),
        sa.Column("response_payload", sa.Text(), nullable=True),
        sa.Column("response_at", sa.DateTime(), nullable=True),
        sa.Column("execution_status", sa.String(length=30), nullable=False, server_default="PENDING"),
        sa.Column("error_message", sa.String(length=500), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index(
        "ix_ceisa_req_log_request_id",
        "ceisa_request_log",
        ["request_id"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_req_log_service_name",
        "ceisa_request_log",
        ["service_name"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_req_log_request_at",
        "ceisa_request_log",
        ["request_at"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_req_log_exec_status",
        "ceisa_request_log",
        ["execution_status"],
        unique=False,
    )

    op.create_table(
        "ceisa_webhook_log",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("webhook_event_id", sa.String(length=100), nullable=True),
        sa.Column("event_type", sa.String(length=100), nullable=True),
        sa.Column("source", sa.String(length=100), nullable=False, server_default="CEISA"),
        sa.Column("request_headers", sa.Text(), nullable=True),
        sa.Column("request_payload", sa.Text(), nullable=True),
        sa.Column("signature_value", sa.String(length=255), nullable=True),
        sa.Column("signature_valid", sa.Boolean(), nullable=True),
        sa.Column("received_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("processing_status", sa.String(length=30), nullable=False, server_default="RECEIVED"),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
        sa.Column("response_status_code", sa.Integer(), nullable=True),
        sa.Column("response_payload", sa.Text(), nullable=True),
        sa.Column("error_message", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        mysql_engine="InnoDB",
        mysql_charset="utf8mb4",
        mysql_collate="utf8mb4_unicode_ci",
    )
    op.create_index(
        "ix_ceisa_webhook_log_event_id",
        "ceisa_webhook_log",
        ["webhook_event_id"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_webhook_log_event_type",
        "ceisa_webhook_log",
        ["event_type"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_webhook_log_received_at",
        "ceisa_webhook_log",
        ["received_at"],
        unique=False,
    )
    op.create_index(
        "ix_ceisa_webhook_log_proc_status",
        "ceisa_webhook_log",
        ["processing_status"],
        unique=False,
    )


def downgrade() -> None:
    """Drop tabel transaksi log request dan webhook CEISA."""
    op.drop_index("ix_ceisa_webhook_log_proc_status", table_name="ceisa_webhook_log")
    op.drop_index("ix_ceisa_webhook_log_received_at", table_name="ceisa_webhook_log")
    op.drop_index("ix_ceisa_webhook_log_event_type", table_name="ceisa_webhook_log")
    op.drop_index("ix_ceisa_webhook_log_event_id", table_name="ceisa_webhook_log")
    op.drop_table("ceisa_webhook_log")

    op.drop_index("ix_ceisa_req_log_exec_status", table_name="ceisa_request_log")
    op.drop_index("ix_ceisa_req_log_request_at", table_name="ceisa_request_log")
    op.drop_index("ix_ceisa_req_log_service_name", table_name="ceisa_request_log")
    op.drop_index("ix_ceisa_req_log_request_id", table_name="ceisa_request_log")
    op.drop_table("ceisa_request_log")

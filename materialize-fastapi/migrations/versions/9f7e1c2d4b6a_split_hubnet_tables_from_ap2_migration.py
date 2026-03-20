"""split hubnet tables from ap2 migration

Revision ID: 9f7e1c2d4b6a
Revises: 8e1f4b2c9d6a
Create Date: 2026-03-20

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "9f7e1c2d4b6a"
down_revision: Union[str, None] = "8e1f4b2c9d6a"
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


def _index_exists(table_name: str, index_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    if not inspector.has_table(table_name):
        return False

    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def _create_hubnet_request_table() -> None:
    op.create_table(
        "hubnet_request",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("AWB_NO", sa.String(length=255), nullable=True),
        sa.Column("ref_id", sa.String(length=255), nullable=True),
        sa.Column("FLT_NUMBER", sa.String(length=255), nullable=True),
        sa.Column("FLT_DATE", sa.String(length=255), nullable=True),
        sa.Column("ORI", sa.String(length=255), nullable=True),
        sa.Column("DEST", sa.String(length=255), nullable=True),
        sa.Column("FLT_NUMBER1", sa.String(length=255), nullable=True),
        sa.Column("FLT_DATE1", sa.String(length=255), nullable=True),
        sa.Column("ORI1", sa.String(length=255), nullable=True),
        sa.Column("T", sa.String(length=255), nullable=True),
        sa.Column("K", sa.String(length=255), nullable=True),
        sa.Column("CH_WEIGHT", sa.String(length=255), nullable=True),
        sa.Column("MC", sa.String(length=255), nullable=True),
        sa.Column("AGT_NAME", sa.String(length=255), nullable=True),
        sa.Column("AGT_ADD", sa.String(length=255), nullable=True),
        sa.Column("SHP_ADD", sa.String(length=255), nullable=True),
        sa.Column("SHP_NAME", sa.String(length=255), nullable=True),
        sa.Column("CNE_NAME", sa.String(length=255), nullable=True),
        sa.Column("CNE_ADD", sa.String(length=255), nullable=True),
        sa.Column("KATEGORI_CARGO", sa.String(length=255), nullable=True),
        sa.Column("COMMODITY", sa.String(length=255), nullable=True),
        sa.Column("CARGO_TREATMENT", sa.String(length=255), nullable=True),
        sa.Column("REMARKS", sa.String(length=255), nullable=True),
        sa.Column("IS_INTERNATIONAL", sa.String(length=255), nullable=True),
        sa.Column("IS_EKSPOR", sa.String(length=255), nullable=True),
        sa.Column("IS_SEND", sa.String(length=255), nullable=True),
        sa.Column("IS_FAILED", sa.String(length=255), nullable=True),
        sa.Column("ERROR_MESSAGE", sa.String(length=255), nullable=True),
        sa.Column("IS_SUCCESS", sa.String(length=255), nullable=True),
        sa.Column("SUCCESS_MESSAGE", sa.String(length=255), nullable=True),
        sa.Column("IS_BREAK", sa.String(length=255), nullable=True),
        sa.Column("BREAK_MESSAGE", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            server_onupdate=sa.text("CURRENT_TIMESTAMP"),
        ),
        mysql_engine="InnoDB",
    )


def _create_hubnet_response_table() -> None:
    op.create_table(
        "hubnet_response",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("status", sa.String(length=255), nullable=True),
        sa.Column("message", sa.String(length=255), nullable=True),
        sa.Column("ref_id", sa.String(length=255), nullable=True),
        sa.Column(
            "create_at",
            sa.TIMESTAMP(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            server_onupdate=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("response_json", sa.String(length=5000), nullable=True),
        mysql_engine="InnoDB",
    )


def _ensure_hubnet_request_indexes() -> None:
    indexes = (
        ("ix_hubnet_request_awb_no", ["AWB_NO"]),
        ("ix_hubnet_request_ref_id", ["ref_id"]),
        ("ix_hubnet_request_is_send", ["IS_SEND"]),
        ("ix_hubnet_request_is_failed", ["IS_FAILED"]),
    )
    for index_name, columns in indexes:
        if not _index_exists("hubnet_request", index_name):
            op.create_index(index_name, "hubnet_request", columns)


def _ensure_hubnet_response_columns() -> None:
    if not _column_exists("hubnet_response", "create_at"):
        op.add_column(
            "hubnet_response",
            sa.Column(
                "create_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
        )

    if not _column_exists("hubnet_response", "updated_at"):
        op.add_column(
            "hubnet_response",
            sa.Column(
                "updated_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
                server_onupdate=sa.text("CURRENT_TIMESTAMP"),
            ),
        )

    if not _column_exists("hubnet_response", "response_json"):
        op.add_column(
            "hubnet_response",
            sa.Column("response_json", sa.String(length=5000), nullable=True),
        )


def upgrade() -> None:
    if not _table_exists("hubnet_request"):
        _create_hubnet_request_table()

    if _table_exists("hubnet_request"):
        _ensure_hubnet_request_indexes()

    if not _table_exists("hubnet_response"):
        _create_hubnet_response_table()
    else:
        _ensure_hubnet_response_columns()


def downgrade() -> None:
    if _table_exists("hubnet_response"):
        op.drop_table("hubnet_response")

    if _table_exists("hubnet_request"):
        op.drop_table("hubnet_request")

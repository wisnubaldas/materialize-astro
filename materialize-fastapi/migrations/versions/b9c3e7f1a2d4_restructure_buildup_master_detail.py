"""restructure buildup into master detail and drop exp_manifest tables

Revision ID: b9c3e7f1a2d4
Revises: e8b4a19c2d7f
Create Date: 2026-04-12 18:20:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import LONGTEXT

# revision identifiers, used by Alembic.
revision: str = "b9c3e7f1a2d4"
down_revision: Union[str, None] = "e8b4a19c2d7f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _drop_table_if_exists(table_name: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name in inspector.get_table_names():
        op.drop_table(table_name)


def _drop_index_if_exists(index_name: str, table_name: str) -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return
    indexes = {index["name"] for index in inspector.get_indexes(table_name)}
    if index_name in indexes:
        op.drop_index(index_name, table_name=table_name)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "build_up" in tables:
        _drop_index_if_exists("ix_build_up_mawb", "build_up")
        _drop_index_if_exists("ix_build_up_number", "build_up")
        op.drop_table("build_up")

    if "build_up_header" not in tables:
        op.create_table(
            "build_up_header",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column("number_build_up", sa.String(length=100), nullable=False),
            sa.Column("airlines_code", sa.String(length=50), nullable=True),
            sa.Column("origin", sa.String(length=50), nullable=True),
            sa.Column("dest", sa.String(length=50), nullable=True),
            sa.Column("flight_date", sa.Date(), nullable=True),
            sa.Column("for_official_use", sa.String(length=255), nullable=True),
            sa.Column("total_pieces", sa.Integer(), nullable=True),
            sa.Column("total_weight", sa.Float(), nullable=True),
            sa.Column("pdf_link", sa.String(length=255), nullable=True),
            sa.Column(
                "create_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            sa.Column(
                "update_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
                server_onupdate=sa.text("CURRENT_TIMESTAMP"),
            ),
            mysql_engine="InnoDB",
        )
        op.create_index(
            "ix_build_up_header_number_build_up",
            "build_up_header",
            ["number_build_up"],
            unique=False,
        )
        op.create_index(
            "ix_build_up_header_flight_date",
            "build_up_header",
            ["flight_date"],
            unique=False,
        )

    if "build_up_detail" not in tables:
        op.create_table(
            "build_up_detail",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column(
                "header_id",
                sa.BigInteger(),
                sa.ForeignKey("build_up_header.id", ondelete="CASCADE"),
                nullable=False,
            ),
            sa.Column("mawb", sa.String(length=100), nullable=True),
            sa.Column("uld_number", sa.String(length=50), nullable=True),
            sa.Column("uld_type", sa.String(length=50), nullable=True),
            sa.Column("pieces", sa.Integer(), nullable=True),
            sa.Column("weight", sa.Float(), nullable=True),
            sa.Column("nature_of_goods", sa.Text(), nullable=True),
            sa.Column("remark", sa.Text(), nullable=True),
            sa.Column(
                "create_at",
                sa.TIMESTAMP(),
                nullable=False,
                server_default=sa.text("CURRENT_TIMESTAMP"),
            ),
            mysql_engine="InnoDB",
        )
        op.create_index(
            "ix_build_up_detail_header_id",
            "build_up_detail",
            ["header_id"],
            unique=False,
        )
        op.create_index(
            "ix_build_up_detail_mawb",
            "build_up_detail",
            ["mawb"],
            unique=False,
        )

    _drop_table_if_exists("exp_manifest_summary")
    _drop_table_if_exists("exp_manifest_mawb")
    _drop_table_if_exists("exp_manifest_uld")
    _drop_table_if_exists("exp_manifest_fligt")


def downgrade() -> None:
    _drop_index_if_exists("ix_build_up_detail_mawb", "build_up_detail")
    _drop_index_if_exists("ix_build_up_detail_header_id", "build_up_detail")
    _drop_table_if_exists("build_up_detail")

    _drop_index_if_exists(
        "ix_build_up_header_number_build_up",
        "build_up_header",
    )
    _drop_index_if_exists(
        "ix_build_up_header_flight_date",
        "build_up_header",
    )
    _drop_table_if_exists("build_up_header")

    op.create_table(
        "build_up",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("number", sa.String(length=100), nullable=True),
        sa.Column("mawb", sa.String(length=100), nullable=True),
        sa.Column("uld_number", sa.String(length=50), nullable=True),
        sa.Column("uld_type", sa.String(length=50), nullable=True),
        sa.Column("airlines_code", sa.String(length=50), nullable=True),
        sa.Column("origin", sa.String(length=50), nullable=True),
        sa.Column("dest", sa.String(length=50), nullable=True),
        sa.Column("flight_date", sa.Date(), nullable=True),
        sa.Column("for_official_use", sa.String(length=100), nullable=True),
        sa.Column("pieces", sa.Integer(), nullable=True),
        sa.Column("total_pieces", sa.Integer(), nullable=True),
        sa.Column("weight", sa.Float(), nullable=True),
        sa.Column("total_weight", sa.Float(), nullable=True),
        sa.Column("nature_of_goods", sa.Text(), nullable=True),
        sa.Column("remark", sa.Text(), nullable=True),
        sa.Column("link_pdf", sa.String(length=255), nullable=True),
        sa.Column(
            "create_at",
            sa.TIMESTAMP(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "update_at",
            sa.TIMESTAMP(),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
            server_onupdate=sa.text("CURRENT_TIMESTAMP"),
        ),
        mysql_engine="InnoDB",
    )
    op.create_index("ix_build_up_number", "build_up", ["number"], unique=False)
    op.create_index("ix_build_up_mawb", "build_up", ["mawb"], unique=False)

    op.create_table(
        "exp_manifest_fligt",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("airline_code", sa.String(length=5), nullable=False),
        sa.Column("flight_number", sa.String(length=10), nullable=False),
        sa.Column("flight_date", sa.Date(), nullable=False),
        sa.Column("aircraft_registration", sa.String(length=20), nullable=True),
        sa.Column("point_of_loading", sa.CHAR(length=3), nullable=False),
        sa.Column("point_of_unloading", sa.CHAR(length=3), nullable=False),
        sa.Column("total_pieces", sa.Integer(), server_default=sa.text("0")),
        sa.Column("total_weight_kg", sa.DECIMAL(10, 2), server_default=sa.text("0")),
        sa.Column(
            "source_document",
            sa.String(length=50),
            server_default=sa.text("'DOCUMENT_MANIFEST'"),
        ),
        sa.Column("raw_text", LONGTEXT, nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
            server_onupdate=sa.text("CURRENT_TIMESTAMP"),
        ),
        mysql_engine="InnoDB",
    )
    op.create_index(
        "uk_flight",
        "exp_manifest_fligt",
        ["flight_number", "flight_date"],
        unique=False,
    )

    op.create_table(
        "exp_manifest_uld",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "flight_id",
            sa.BigInteger(),
            sa.ForeignKey("exp_manifest_fligt.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("uld_type", sa.String(length=5), nullable=False),
        sa.Column("uld_number", sa.String(length=20), nullable=False),
        sa.Column("uld_owner", sa.String(length=5), server_default=sa.text("'FX'")),
        sa.Column("destination", sa.CHAR(length=3), nullable=False),
        sa.Column("remarks", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        mysql_engine="InnoDB",
    )
    op.create_index(
        "uk_uld",
        "exp_manifest_uld",
        ["flight_id", "uld_type", "uld_number"],
        unique=False,
    )

    op.create_table(
        "exp_manifest_mawb",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "uld_id",
            sa.BigInteger(),
            sa.ForeignKey("exp_manifest_uld.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("mawb_prefix", sa.CHAR(length=3), nullable=False),
        sa.Column("mawb_number", sa.String(length=20), nullable=False),
        sa.Column("pieces", sa.Integer(), nullable=False),
        sa.Column("weight_kg", sa.DECIMAL(10, 2), nullable=False),
        sa.Column("nature_of_goods", sa.String(length=100), nullable=True),
        sa.Column("route", sa.String(length=50), nullable=True),
        sa.Column("transit_flag", sa.Boolean(), server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        mysql_engine="InnoDB",
    )
    op.create_index(
        "uk_mawb",
        "exp_manifest_mawb",
        ["mawb_prefix", "mawb_number"],
        unique=False,
    )

    op.create_table(
        "exp_manifest_summary",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "flight_id",
            sa.BigInteger(),
            sa.ForeignKey("exp_manifest_fligt.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("total_pieces", sa.Integer(), nullable=True),
        sa.Column("total_weight_kg", sa.DECIMAL(10, 2), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        mysql_engine="InnoDB",
    )

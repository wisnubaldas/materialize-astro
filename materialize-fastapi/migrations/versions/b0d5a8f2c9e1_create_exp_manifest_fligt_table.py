"""create exp manifest fligt table

Revision ID: b0d5a8f2c9e1
Revises: 8325f2a2ee4c
Create Date: 2025-12-24 10:15:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import LONGTEXT

# revision identifiers, used by Alembic.
revision: str = "b0d5a8f2c9e1"
down_revision: Union[str, None] = "8325f2a2ee4c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exp_manifest_fligt",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("airline_code", sa.String(length=5), nullable=False, comment="FX"),
        sa.Column("flight_number", sa.String(length=10), nullable=False, comment="FX6068"),
        sa.Column("flight_date", sa.Date(), nullable=False),
        sa.Column(
            "aircraft_registration",
            sa.String(length=20),
            nullable=True,
            comment="N112FE",
        ),
        sa.Column(
            "point_of_loading",
            sa.CHAR(length=3),
            nullable=False,
            comment="CGK",
        ),
        sa.Column(
            "point_of_unloading",
            sa.CHAR(length=3),
            nullable=False,
            comment="SIN",
        ),
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


def downgrade() -> None:
    op.drop_table("exp_manifest_fligt")

"""add airlines tables

Revision ID: e4e36765abe3
Revises: 066a69bd645b
Create Date: 2025-11-26 23:12:50.318945

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from migrations.seeders.airlinesData import AIRLINES

# revision identifiers, used by Alembic.
revision: str = "e4e36765abe3"
down_revision: Union[str, None] = "5847d94ff882"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "master_airlines",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("iata_code", sa.String(length=5), nullable=True),
        sa.Column("icao_code", sa.String(length=5), nullable=True),
        sa.Column("airline_name", sa.String(length=100), nullable=False),
        sa.Column("short_name", sa.String(length=50), nullable=True),
        sa.Column("country", sa.String(length=100), nullable=True),
        sa.Column("awb_prefix", sa.String(length=10), nullable=True),
        sa.Column("home_base", sa.String(length=10), nullable=True),
        sa.Column("cargo_handling_agent", sa.String(length=100), nullable=True),
        sa.Column("sitatex_address", sa.String(length=50), nullable=True),
        sa.Column("edi_support", sa.JSON(), nullable=True),
        sa.Column("special_handling_codes", sa.JSON(), nullable=True),
        sa.Column("allowed_uld_types", sa.JSON(), nullable=True),
        sa.Column("contact_person", sa.String(length=100), nullable=True),
        sa.Column("contact_email", sa.String(length=100), nullable=True),
        sa.Column("contact_phone", sa.String(length=50), nullable=True),
        sa.Column(
            "status",
            sa.Enum("ACTIVE", "INACTIVE", name="airline_status"),
            nullable=False,
            server_default="ACTIVE",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(),
            nullable=False,
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
        ),
        mysql_charset="utf8mb4",
    )

    # --- Seeder 50 airlines awal ---
    master_airlines_table = sa.table(
        "master_airlines",
        sa.Column("iata_code", sa.String(length=5)),
        sa.Column("icao_code", sa.String(length=5)),
        sa.Column("airline_name", sa.String(length=100)),
        sa.Column("short_name", sa.String(length=50)),
        sa.Column("country", sa.String(length=100)),
        sa.Column("awb_prefix", sa.String(length=10)),
        sa.Column("home_base", sa.String(length=10)),
        sa.Column("status", sa.String(length=10)),
        sa.Column("contact_person", sa.String(length=100)),
        sa.Column("contact_email", sa.String(length=100)),
        sa.Column("contact_phone", sa.String(length=100)),
    )

    op.bulk_insert(master_airlines_table, AIRLINES)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("master_airlines")

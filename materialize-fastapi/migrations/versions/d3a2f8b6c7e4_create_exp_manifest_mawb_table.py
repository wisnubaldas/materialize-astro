"""create exp manifest mawb table

Revision ID: d3a2f8b6c7e4
Revises: c1f7a9d3a42b
Create Date: 2025-12-24 10:35:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "d3a2f8b6c7e4"
down_revision: Union[str, None] = "c1f7a9d3a42b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exp_manifest_mawb",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "uld_id",
            sa.BigInteger(),
            sa.ForeignKey("exp_manifest_uld.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("mawb_prefix", sa.CHAR(length=3), nullable=False, comment="023"),
        sa.Column("mawb_number", sa.String(length=20), nullable=False, comment="50032651"),
        sa.Column("pieces", sa.Integer(), nullable=False),
        sa.Column("weight_kg", sa.DECIMAL(10, 2), nullable=False),
        sa.Column("nature_of_goods", sa.String(length=100), nullable=True, comment="CONSOL"),
        sa.Column("route", sa.String(length=50), nullable=True, comment="CGK-SIN-MEM"),
        sa.Column("transit_flag", sa.Boolean(), server_default=sa.text("0")),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.UniqueConstraint("mawb_prefix", "mawb_number", name="uk_mawb"),
        mysql_engine="InnoDB",
    )


def downgrade() -> None:
    op.drop_table("exp_manifest_mawb")

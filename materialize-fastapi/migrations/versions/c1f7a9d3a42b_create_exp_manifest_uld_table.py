"""create exp manifest uld table

Revision ID: c1f7a9d3a42b
Revises: b0d5a8f2c9e1
Create Date: 2025-12-24 10:25:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "c1f7a9d3a42b"
down_revision: Union[str, None] = "b0d5a8f2c9e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "exp_manifest_uld",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column(
            "flight_id",
            sa.BigInteger(),
            sa.ForeignKey("exp_manifest_fligt.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("uld_type", sa.String(length=5), nullable=False, comment="AAD, AKE, PMC"),
        sa.Column("uld_number", sa.String(length=20), nullable=False, comment="20282"),
        sa.Column(
            "uld_owner",
            sa.String(length=5),
            server_default=sa.text("'FX'"),
        ),
        sa.Column("destination", sa.CHAR(length=3), nullable=False, comment="SIN"),
        sa.Column("remarks", sa.String(length=255), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.UniqueConstraint("flight_id", "uld_type", "uld_number", name="uk_uld"),
        mysql_engine="InnoDB",
    )


def downgrade() -> None:
    op.drop_table("exp_manifest_uld")

"""create exp manifest summary table

Revision ID: f4c1d9a7e2b3
Revises: d3a2f8b6c7e4
Create Date: 2025-12-24 10:45:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "f4c1d9a7e2b3"
down_revision: Union[str, None] = "d3a2f8b6c7e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
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


def downgrade() -> None:
    op.drop_table("exp_manifest_summary")

"""create invoice daily counter table

Revision ID: 8e1f4b2c9d6a
Revises: 6c340a5bd677
Create Date: 2026-03-10 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "8e1f4b2c9d6a"
down_revision: Union[str, None] = "6c340a5bd677"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "invoice_daily_counter",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("tanggal", sa.Date(), nullable=False),
        sa.Column("jumlah_invoice", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_koli", sa.DECIMAL(18, 2), nullable=False, server_default="0.00"),
        sa.Column("total_berat", sa.DECIMAL(18, 2), nullable=False, server_default="0.00"),
        sa.Column("total_volume", sa.DECIMAL(18, 2), nullable=False, server_default="0.00"),
        sa.Column(
            "total_pendapatan_tanpa_ppn",
            sa.DECIMAL(18, 2),
            nullable=False,
            server_default="0.00",
        ),
        sa.Column(
            "total_pendapatan_dengan_ppn",
            sa.DECIMAL(18, 2),
            nullable=False,
            server_default="0.00",
        ),
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
        sa.UniqueConstraint("tanggal", name="uq_invoice_daily_counter_tanggal"),
        mysql_engine="InnoDB",
    )


def downgrade() -> None:
    op.drop_table("invoice_daily_counter")

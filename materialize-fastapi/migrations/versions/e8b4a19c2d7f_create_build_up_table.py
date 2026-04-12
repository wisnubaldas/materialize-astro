"""create build_up table

Revision ID: e8b4a19c2d7f
Revises: a7c2d4e9f1b8
Create Date: 2026-04-11 10:30:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "e8b4a19c2d7f"
down_revision: Union[str, None] = "a7c2d4e9f1b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
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


def downgrade() -> None:
    op.drop_index("ix_build_up_mawb", table_name="build_up")
    op.drop_index("ix_build_up_number", table_name="build_up")
    op.drop_table("build_up")

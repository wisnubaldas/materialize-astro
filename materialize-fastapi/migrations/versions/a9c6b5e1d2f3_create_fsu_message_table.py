"""create fsu_message table

Revision ID: a9c6b5e1d2f3
Revises: 5b9c2f4a1a0b
Create Date: 2026-01-15 09:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a9c6b5e1d2f3"
down_revision: Union[str, None] = "5b9c2f4a1a0b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "fsu_message",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("code", sa.String(length=10), nullable=False),
        sa.Column("remark", sa.Text(), nullable=False),
        sa.Column("status", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        mysql_engine="InnoDB",
    )

    fsu_message_table = sa.table(
        "fsu_message",
        sa.Column("code", sa.String(length=10)),
        sa.Column("remark", sa.Text()),
        sa.Column("status", sa.Boolean()),
    )

    op.bulk_insert(
        fsu_message_table,
        [
            {"code": "RCS", "remark": "Received from Shipper", "status": True},
            {"code": "DEP", "remark": "Departed", "status": True},
            {"code": "ARR", "remark": "Arrived", "status": True},
            {"code": "RCF", "remark": "Received from Flight", "status": True},
            {"code": "TFD", "remark": "Transferred", "status": True},
            {"code": "DIS", "remark": "Discrepancy", "status": True},
            {"code": "NFD", "remark": "Notified", "status": True},
            {"code": "DLV", "remark": "Delivered", "status": True},
            {"code": "AWD", "remark": "Awaiting Delivery", "status": True},
            {"code": "CCD", "remark": "Customs Cleared", "status": True},
        ],
    )


def downgrade() -> None:
    op.drop_table("fsu_message")

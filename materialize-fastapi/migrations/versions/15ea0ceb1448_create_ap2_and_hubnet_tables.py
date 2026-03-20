"""create ap2 tables

Revision ID: 15ea0ceb1448
Revises: d9e0a1b2c3d4
Create Date: 2026-02-05

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "15ea0ceb1448"
down_revision: Union[str, None] = "d9e0a1b2c3d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _table_exists(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return inspector.has_table(table_name)


def upgrade() -> None:
    if not _table_exists("ap2_fail_inv"):
        op.create_table(
            "ap2_fail_inv",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column("inv", sa.String(length=255), nullable=True),
            sa.Column("desc", sa.Text(), nullable=True),
            sa.Column("status", sa.Integer(), nullable=True),
            mysql_engine="InnoDB",
        )

    if not _table_exists("inv_ap2"):
        op.create_table(
            "inv_ap2",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column("NO_INVOICE", sa.String(length=255), nullable=True),
            sa.Column("TANGGAL", sa.String(length=255), nullable=False),
            sa.Column("SMU", sa.String(length=255), nullable=False),
            sa.Column("KDAIRLINE", sa.String(length=255), nullable=False),
            sa.Column("FLIGHT_NUMBER", sa.String(length=255), nullable=False),
            sa.Column("DOM_INT", sa.String(length=255), nullable=False),
            sa.Column("INC_OUT", sa.String(length=255), nullable=False),
            sa.Column("ASAL", sa.String(length=255), nullable=False),
            sa.Column("TUJUAN", sa.String(length=255), nullable=False),
            sa.Column("JENIS_KARGO", sa.String(length=255), nullable=False),
            sa.Column("TARIF_KARGO", sa.String(length=255), nullable=False),
            sa.Column("KOLI", sa.String(length=255), nullable=False),
            sa.Column("BERAT", sa.String(length=255), nullable=False),
            sa.Column("VOLUME", sa.String(length=255), nullable=False),
            sa.Column("JML_HARI", sa.String(length=255), nullable=False),
            sa.Column("CARGO_CHG", sa.String(length=255), nullable=False),
            sa.Column("KADE", sa.String(length=255), nullable=False),
            sa.Column("TOTAL_PENDAPATAN_TANPA_PPN", sa.String(length=255), nullable=False),
            sa.Column("TOTAL_PENDAPATAN_DENGAN_PPN", sa.String(length=255), nullable=False),
            sa.Column("PJT_HANDLING_FEE", sa.Integer(), nullable=True),
            sa.Column("RUSH_HANDLING_FEE", sa.Integer(), nullable=True),
            sa.Column("RUSH_SERVICE_FEE", sa.Integer(), nullable=True),
            sa.Column("TRANSHIPMENT_FEE", sa.Integer(), nullable=True),
            sa.Column("ADMINISTRATION_FEE", sa.Integer(), nullable=True),
            sa.Column("DOCUMENTS_FEE", sa.Integer(), nullable=True),
            sa.Column("PECAH_PU_FEE", sa.Integer(), nullable=True),
            sa.Column("COOL_COLD_STORAGE_FEE", sa.Integer(), nullable=True),
            sa.Column("STRONG_ROOM_FEE", sa.Integer(), nullable=True),
            sa.Column("AC_ROOM_FEE", sa.Integer(), nullable=True),
            sa.Column("DG_ROOM_FEE", sa.Integer(), nullable=True),
            sa.Column("AVI_ROOM_FEE", sa.Integer(), nullable=True),
            sa.Column("DANGEROUS_GOOD_CHECK_FEE", sa.Integer(), nullable=True),
            sa.Column("DISCOUNT_FEE", sa.Integer(), nullable=True),
            sa.Column("RKSP_FEE", sa.Integer(), nullable=True),
            sa.Column("HAWB", sa.String(length=255), nullable=False),
            sa.Column("HAWB_FEE", sa.Integer(), nullable=True),
            sa.Column("HAWB_MAWB_FEE", sa.Integer(), nullable=True),
            sa.Column("CSC_FEE", sa.Integer(), nullable=True),
            sa.Column("ENVIROTAINER_ELEC_FEE", sa.Integer(), nullable=True),
            sa.Column("ADDITIONAL_COSTS", sa.Integer(), nullable=True),
            sa.Column("NAWB_FEE", sa.Integer(), nullable=True),
            sa.Column("BARCODE_FEE", sa.Integer(), nullable=True),
            sa.Column("CARGO_DEVELOPMENT_FEE", sa.Integer(), nullable=True),
            sa.Column("DUTIABLE_SHIPMENT_FEE", sa.Integer(), nullable=True),
            sa.Column("FHL_FEE", sa.Integer(), nullable=True),
            sa.Column("FWB_FEE", sa.Integer(), nullable=True),
            sa.Column("CARGO_INSPECTION_REPORT_FEE", sa.Integer(), nullable=True),
            sa.Column("MATERAI_FEE", sa.Integer(), nullable=True),
            sa.Column("PPN_FEE", sa.Integer(), nullable=True),
            sa.Column("status", sa.SmallInteger(), nullable=False),
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

    if not _table_exists("respons_inv_ap2"):
        op.create_table(
            "respons_inv_ap2",
            sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
            sa.Column("inv", sa.String(length=255), nullable=True),
            sa.Column("response", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=255), nullable=True),
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

    if not _table_exists("void_inv_ap2"):
        op.create_table(
            "void_inv_ap2",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("TANGGAL", sa.String(length=50), nullable=True),
            sa.Column("NO_INVOICE", sa.String(length=100), nullable=True),
            sa.Column("HAWB", sa.String(length=100), nullable=True),
            sa.Column("SMU", sa.String(length=100), nullable=True),
            sa.Column("RESPONSE", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=True),
            mysql_engine="InnoDB",
        )

def downgrade() -> None:
    op.drop_table("void_inv_ap2")
    op.drop_table("respons_inv_ap2")
    op.drop_table("inv_ap2")
    op.drop_table("ap2_fail_inv")

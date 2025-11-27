"""create ffm fwb fhl tables

Revision ID: 8325f2a2ee4c
Revises: e4e36765abe3
Create Date: 2025-11-27 23:58:24.714034

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.mysql import JSON, VARCHAR, INTEGER, DATETIME, DECIMAL

# revision identifiers, used by Alembic.
revision: str = "8325f2a2ee4c"
down_revision: Union[str, None] = "e4e36765abe3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ffm",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        # MAWB → contoh dari file PDF
        sa.Column("mawb", VARCHAR(20), nullable=False),
        # Flight Info
        sa.Column("flight_no", VARCHAR(20)),
        sa.Column("flight_date", DATETIME),
        sa.Column("origin", VARCHAR(10)),
        sa.Column("destination", VARCHAR(10)),
        sa.Column("via", VARCHAR(200)),
        # Shipment summary
        sa.Column("total_pieces", INTEGER),
        sa.Column("total_weight", DECIMAL(10, 2)),
        sa.Column("weight_unit", VARCHAR(5), default="KG"),
        # House list (JSON)
        sa.Column("house_list", JSON),  # [{hawb, pcs, weight, consignee}]
        sa.Column("raw_message", sa.Text),  # Original FFM String
        sa.Column("created_at", DATETIME, server_default=sa.func.now()),
    )

    # -----------------------------
    # TABEL FWB (Master Air Waybill – Detail MAWB)
    # -----------------------------
    op.create_table(
        "fwb",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        # Basic MAWB data
        sa.Column("mawb", VARCHAR(20), nullable=False),
        # Shipper / Consignee → diambil dari MAWB PDF
        sa.Column("shipper_name", VARCHAR(200)),
        sa.Column("shipper_address", sa.Text),
        sa.Column("consignee_name", VARCHAR(200)),
        sa.Column("consignee_address", sa.Text),
        # Flight + Routing
        sa.Column("flight_no", VARCHAR(20)),
        sa.Column("flight_date", DATETIME),
        sa.Column("origin", VARCHAR(10)),
        sa.Column("destination", VARCHAR(10)),
        sa.Column("routing", VARCHAR(200)),  # CGK → DOH → ZRH example
        # Shipment Detail
        sa.Column("pieces", INTEGER),
        sa.Column("weight", DECIMAL(10, 2)),
        sa.Column("volume", DECIMAL(10, 2)),
        sa.Column("goods_description", sa.Text),
        # Charges
        sa.Column("chargeable_weight", DECIMAL(10, 2)),
        sa.Column("rate_class", VARCHAR(10)),
        sa.Column("total_charge", DECIMAL(10, 2)),
        sa.Column("raw_message", sa.Text),  # FWB Raw EDI
        sa.Column("created_at", DATETIME, server_default=sa.func.now()),
    )

    # -----------------------------
    # TABEL FHL (House List – detail House AWB per MAWB)
    # -----------------------------
    op.create_table(
        "fhl",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        # MAWB yang menaungi HAWB
        sa.Column("mawb", VARCHAR(20), nullable=False),
        # House AWB
        sa.Column("hawb", VARCHAR(20), nullable=False),
        # Party
        sa.Column("shipper_name", VARCHAR(200)),
        sa.Column("consignee_name", VARCHAR(200)),
        # Shipment
        sa.Column("pieces", INTEGER),
        sa.Column("weight", DECIMAL(10, 2)),
        sa.Column("volume", DECIMAL(10, 2)),
        sa.Column("goods_description", sa.Text),
        # Other meta
        sa.Column("raw_message", sa.Text),
        sa.Column("created_at", DATETIME, server_default=sa.func.now()),
    )
    # -----------------------------------------
    # SEEDER DATA FFM, FWB, FHL
    # -----------------------------------------
    ffm_table = table(
        "ffm",
        column("mawb", String),
        column("flight_no", String),
        column("flight_date", DateTime),
        column("origin", String),
        column("destination", String),
        column("via", String),
        column("total_pieces", Integer),
        column("total_weight", Numeric),
        column("weight_unit", String),
        column("house_list", JSON),
        column("raw_message", Text),
    )

    fwb_table = table(
        "fwb",
        column("mawb", String),
        column("shipper_name", String),
        column("shipper_address", Text),
        column("consignee_name", String),
        column("consignee_address", Text),
        column("flight_no", String),
        column("flight_date", DateTime),
        column("origin", String),
        column("destination", String),
        column("routing", String),
        column("pieces", Integer),
        column("weight", Numeric),
        column("volume", Numeric),
        column("goods_description", Text),
        column("chargeable_weight", Numeric),
        column("rate_class", String),
        column("total_charge", Numeric),
        column("raw_message", Text),
    )

    fhl_table = table(
        "fhl",
        column("mawb", String),
        column("hawb", String),
        column("shipper_name", String),
        column("consignee_name", String),
        column("pieces", Integer),
        column("weight", Numeric),
        column("volume", Numeric),
        column("goods_description", Text),
        column("raw_message", Text),
    )

    # Insert Data FFM
    op.bulk_insert(
        ffm_table,
        [
            {
                "mawb": "157-49140490",
                "flight_no": "QR6068",
                "flight_date": datetime.datetime(2025, 11, 7),
                "origin": "CAN",
                "destination": "ZRH",
                "via": "DOH",
                "total_pieces": 65,
                "total_weight": 1377.0,
                "weight_unit": "KG",
                "house_list": [
                    {
                        "hawb": "H001",
                        "pcs": 10,
                        "weight": 210.0,
                        "consignee": "GLOBAL AIRFREIGHT GMBH",
                    },
                    {
                        "hawb": "H002",
                        "pcs": 20,
                        "weight": 450.0,
                        "consignee": "GLOBAL AIRFREIGHT GMBH",
                    },
                    {
                        "hawb": "H003",
                        "pcs": 35,
                        "weight": 717.0,
                        "consignee": "GLOBAL AIRFREIGHT GMBH",
                    },
                ],
                "raw_message": "SAMPLE FFM MESSAGE FOR MAWB 157-49140490",
            }
        ],
    )

    # Insert Data FWB
    op.bulk_insert(
        fwb_table,
        [
            {
                "mawb": "157-49140490",
                "shipper_name": "MAXTENA GLOBAL SOURCE AGENCY CO. LTD",
                "shipper_address": "ROOM 12A, STAR AIR CENTER, BAOAN DISTRICT, SHENZHEN",
                "consignee_name": "GLOBAL AIRFREIGHT GMBH",
                "consignee_address": "OPERATION CENTER 4, ZURICH-AIRPORT, SWITZERLAND",
                "flight_no": "QR6068",
                "flight_date": datetime.datetime(2025, 11, 7),
                "origin": "CAN",
                "destination": "ZRH",
                "routing": "CAN -> DOH -> ZRH",
                "pieces": 65,
                "weight": 1377.0,
                "volume": 11.2,
                "goods_description": "WOMEN'S KNIT T-SHIRT, MEN'S COTTON T-SHIRT",
                "chargeable_weight": 1377.0,
                "rate_class": "Q",
                "total_charge": 57503.52,
                "raw_message": "SAMPLE FWB MESSAGE FOR MAWB 157-49140490",
            }
        ],
    )

    # Insert Data FHL (3 HAWB Sample)
    op.bulk_insert(
        fhl_table,
        [
            {
                "mawb": "157-49140490",
                "hawb": "H001",
                "shipper_name": "MAXTENA GLOBAL SOURCE AGENCY CO. LTD",
                "consignee_name": "GLOBAL AIRFREIGHT GMBH",
                "pieces": 10,
                "weight": 210.0,
                "volume": 1.5,
                "goods_description": "WOMEN'S KNIT T-SHIRT",
                "raw_message": "FHL FOR H001",
            },
            {
                "mawb": "157-49140490",
                "hawb": "H002",
                "shipper_name": "MAXTENA GLOBAL SOURCE AGENCY CO. LTD",
                "consignee_name": "GLOBAL AIRFREIGHT GMBH",
                "pieces": 20,
                "weight": 450.0,
                "volume": 3.0,
                "goods_description": "MEN'S T-SHIRT",
                "raw_message": "FHL FOR H002",
            },
            {
                "mawb": "157-49140490",
                "hawb": "H003",
                "shipper_name": "MAXTENA GLOBAL SOURCE AGENCY CO. LTD",
                "consignee_name": "GLOBAL AIRFREIGHT GMBH",
                "pieces": 35,
                "weight": 717.0,
                "volume": 6.7,
                "goods_description": "MIXED GARMENTS",
                "raw_message": "FHL FOR H003",
            },
        ],
    )


def downgrade() -> None:
    op.drop_table("fhl")
    op.drop_table("fwb")
    op.drop_table("ffm")


from sqlalchemy.sql import table, column
from sqlalchemy import String, Integer, Numeric, Text, JSON, DateTime, literal
import datetime

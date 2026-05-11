"""normalize fwb columns to match frontend form

Revision ID: 8c1addb3c06c
Revises: aa0000000032
Create Date: 2026-05-12 00:45:27.368807

"""
from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "8c1addb3c06c"
down_revision: str | None = "aa0000000032"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLE_NAME = "fwb"


def _get_columns(table_name: str) -> dict[str, dict[str, object]]:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if table_name not in inspector.get_table_names():
        return {}
    return {column["name"]: column for column in inspector.get_columns(table_name)}


def _has_column(columns: dict[str, dict[str, object]], column_name: str) -> bool:
    return column_name in columns


def _truncate_text_column(column_name: str, max_length: int) -> None:
    op.get_bind().execute(
        sa.text(
            f"""
            UPDATE `{TABLE_NAME}`
            SET `{column_name}` = LEFT(`{column_name}`, :max_length)
            WHERE `{column_name}` IS NOT NULL
              AND CHAR_LENGTH(`{column_name}`) > :max_length
            """
        ),
        {"max_length": max_length},
    )


def _ensure_column(
    columns: dict[str, dict[str, object]],
    column_name: str,
    column_type: sa.types.TypeEngine,
) -> None:
    if _has_column(columns, column_name):
        return
    op.add_column(TABLE_NAME, sa.Column(column_name, column_type, nullable=True))
    columns[column_name] = {"name": column_name, "type": column_type, "nullable": True}


def _alter_column_type(
    columns: dict[str, dict[str, object]],
    column_name: str,
    target_type: sa.types.TypeEngine,
) -> None:
    if not _has_column(columns, column_name):
        return

    current = columns[column_name]
    op.alter_column(
        TABLE_NAME,
        column_name,
        existing_type=current["type"],
        type_=target_type,
        existing_nullable=bool(current.get("nullable", True)),
    )
    columns[column_name]["type"] = target_type


def upgrade() -> None:
    """Normalize fwb table schema to follow FWB frontend field specs."""
    columns = _get_columns(TABLE_NAME)
    if not columns:
        return

    # Ensure extended FWB columns exist (for databases that skipped older branch migrations).
    _ensure_column(columns, "message_type", sa.String(length=3))
    _ensure_column(columns, "message_version", sa.String(length=3))
    _ensure_column(columns, "awb_prefix", sa.String(length=3))
    _ensure_column(columns, "awb_number", sa.String(length=8))
    _ensure_column(columns, "shipment_description_code", sa.String(length=1))
    _ensure_column(columns, "total_pieces", sa.Integer())
    _ensure_column(columns, "weight_unit", sa.String(length=1))
    _ensure_column(columns, "gross_weight", sa.Numeric(10, 3))
    _ensure_column(columns, "routing_list", sa.String(length=120))
    _ensure_column(columns, "first_carrier", sa.String(length=2))
    _ensure_column(columns, "onward_carrier", sa.String(length=2))
    _ensure_column(columns, "flight_number", sa.String(length=5))
    _ensure_column(columns, "flight_carrier", sa.String(length=2))
    _ensure_column(columns, "shipper_city", sa.String(length=17))
    _ensure_column(columns, "shipper_state", sa.String(length=9))
    _ensure_column(columns, "shipper_country", sa.String(length=2))
    _ensure_column(columns, "shipper_postcode", sa.String(length=9))
    _ensure_column(columns, "shipper_contact", sa.String(length=25))
    _ensure_column(columns, "consignee_city", sa.String(length=17))
    _ensure_column(columns, "consignee_state", sa.String(length=9))
    _ensure_column(columns, "consignee_country", sa.String(length=2))
    _ensure_column(columns, "consignee_postcode", sa.String(length=9))
    _ensure_column(columns, "consignee_contact", sa.String(length=25))
    _ensure_column(columns, "agent_iata_code", sa.String(length=7))
    _ensure_column(columns, "agent_account", sa.String(length=25))
    _ensure_column(columns, "agent_name", sa.String(length=20))
    _ensure_column(columns, "agent_city", sa.String(length=17))
    _ensure_column(columns, "currency", sa.String(length=3))
    _ensure_column(columns, "charge_code", sa.String(length=2))
    _ensure_column(columns, "weight_charge_pp_cc", sa.String(length=2))
    _ensure_column(columns, "other_charge_pp_cc", sa.String(length=2))
    _ensure_column(columns, "declared_value_carriage", sa.String(length=12))
    _ensure_column(columns, "declared_value_customs", sa.String(length=12))
    _ensure_column(columns, "insurance_value", sa.String(length=12))
    _ensure_column(columns, "rate_line_no", sa.String(length=2))
    _ensure_column(columns, "rate", sa.Numeric(14, 2))
    _ensure_column(columns, "dimensions", sa.String(length=65))
    _ensure_column(columns, "slac", sa.String(length=4))
    _ensure_column(columns, "hs_code", sa.String(length=18))
    _ensure_column(columns, "country_of_origin", sa.String(length=2))
    _ensure_column(columns, "other_charge_code", sa.String(length=10))
    _ensure_column(columns, "entitlement", sa.String(length=10))
    _ensure_column(columns, "amount", sa.Numeric(14, 2))
    _ensure_column(columns, "prepaid_weight_charge", sa.Numeric(14, 2))
    _ensure_column(columns, "prepaid_other_charge", sa.Numeric(14, 2))
    _ensure_column(columns, "total_prepaid", sa.Numeric(14, 2))
    _ensure_column(columns, "collect_charge", sa.Numeric(14, 2))
    _ensure_column(columns, "shipper_certification", sa.String(length=20))
    _ensure_column(columns, "issue_date", sa.Date())
    _ensure_column(columns, "issue_place", sa.String(length=17))
    _ensure_column(columns, "issued_by", sa.String(length=20))
    _ensure_column(columns, "special_handling_code", sa.String(length=3))
    _ensure_column(columns, "ssr", sa.String(length=65))
    _ensure_column(columns, "osi", sa.String(length=65))
    _ensure_column(columns, "oci", sa.String(length=65))

    # Truncate values before shrinking VARCHAR/TEXT columns.
    truncation_rules = {
        "shipper_name": 35,
        "shipper_address": 70,
        "consignee_name": 35,
        "consignee_address": 70,
        "flight_no": 5,
        "origin": 3,
        "destination": 3,
        "routing": 120,
        "goods_description": 20,
        "rate_class": 1,
        "message_type": 3,
        "message_version": 3,
        "awb_prefix": 3,
        "awb_number": 8,
        "shipment_description_code": 1,
        "weight_unit": 1,
        "routing_list": 120,
        "first_carrier": 2,
        "onward_carrier": 2,
        "flight_number": 5,
        "flight_carrier": 2,
        "shipper_city": 17,
        "shipper_state": 9,
        "shipper_country": 2,
        "shipper_postcode": 9,
        "shipper_contact": 25,
        "consignee_city": 17,
        "consignee_state": 9,
        "consignee_country": 2,
        "consignee_postcode": 9,
        "consignee_contact": 25,
        "agent_iata_code": 7,
        "agent_account": 25,
        "agent_name": 20,
        "agent_city": 17,
        "currency": 3,
        "charge_code": 2,
        "weight_charge_pp_cc": 2,
        "other_charge_pp_cc": 2,
        "declared_value_carriage": 12,
        "declared_value_customs": 12,
        "insurance_value": 12,
        "rate_line_no": 2,
        "dimensions": 65,
        "slac": 4,
        "hs_code": 18,
        "country_of_origin": 2,
        "other_charge_code": 10,
        "entitlement": 10,
        "shipper_certification": 20,
        "issue_place": 17,
        "issued_by": 20,
        "special_handling_code": 3,
        "ssr": 65,
        "osi": 65,
        "oci": 65,
    }
    for name, limit in truncation_rules.items():
        if _has_column(columns, name):
            _truncate_text_column(name, limit)

    # Align column types with current frontend FWB form constraints.
    _alter_column_type(columns, "shipper_name", sa.String(length=35))
    _alter_column_type(columns, "shipper_address", sa.String(length=70))
    _alter_column_type(columns, "consignee_name", sa.String(length=35))
    _alter_column_type(columns, "consignee_address", sa.String(length=70))
    _alter_column_type(columns, "flight_no", sa.String(length=5))
    _alter_column_type(columns, "origin", sa.String(length=3))
    _alter_column_type(columns, "destination", sa.String(length=3))
    _alter_column_type(columns, "routing", sa.String(length=120))
    _alter_column_type(columns, "pieces", sa.Integer())
    _alter_column_type(columns, "weight", sa.Numeric(10, 3))
    _alter_column_type(columns, "volume", sa.Numeric(12, 3))
    _alter_column_type(columns, "goods_description", sa.String(length=20))
    _alter_column_type(columns, "chargeable_weight", sa.Numeric(10, 3))
    _alter_column_type(columns, "rate_class", sa.String(length=1))
    _alter_column_type(columns, "total_charge", sa.Numeric(14, 2))
    _alter_column_type(columns, "message_type", sa.String(length=3))
    _alter_column_type(columns, "message_version", sa.String(length=3))
    _alter_column_type(columns, "awb_prefix", sa.String(length=3))
    _alter_column_type(columns, "awb_number", sa.String(length=8))
    _alter_column_type(columns, "shipment_description_code", sa.String(length=1))
    _alter_column_type(columns, "total_pieces", sa.Integer())
    _alter_column_type(columns, "weight_unit", sa.String(length=1))
    _alter_column_type(columns, "gross_weight", sa.Numeric(10, 3))
    _alter_column_type(columns, "routing_list", sa.String(length=120))
    _alter_column_type(columns, "first_carrier", sa.String(length=2))
    _alter_column_type(columns, "onward_carrier", sa.String(length=2))
    _alter_column_type(columns, "flight_number", sa.String(length=5))
    _alter_column_type(columns, "flight_carrier", sa.String(length=2))
    _alter_column_type(columns, "shipper_city", sa.String(length=17))
    _alter_column_type(columns, "shipper_state", sa.String(length=9))
    _alter_column_type(columns, "shipper_country", sa.String(length=2))
    _alter_column_type(columns, "shipper_postcode", sa.String(length=9))
    _alter_column_type(columns, "shipper_contact", sa.String(length=25))
    _alter_column_type(columns, "consignee_city", sa.String(length=17))
    _alter_column_type(columns, "consignee_state", sa.String(length=9))
    _alter_column_type(columns, "consignee_country", sa.String(length=2))
    _alter_column_type(columns, "consignee_postcode", sa.String(length=9))
    _alter_column_type(columns, "consignee_contact", sa.String(length=25))
    _alter_column_type(columns, "agent_iata_code", sa.String(length=7))
    _alter_column_type(columns, "agent_account", sa.String(length=25))
    _alter_column_type(columns, "agent_name", sa.String(length=20))
    _alter_column_type(columns, "agent_city", sa.String(length=17))
    _alter_column_type(columns, "currency", sa.String(length=3))
    _alter_column_type(columns, "charge_code", sa.String(length=2))
    _alter_column_type(columns, "weight_charge_pp_cc", sa.String(length=2))
    _alter_column_type(columns, "other_charge_pp_cc", sa.String(length=2))
    _alter_column_type(columns, "declared_value_carriage", sa.String(length=12))
    _alter_column_type(columns, "declared_value_customs", sa.String(length=12))
    _alter_column_type(columns, "insurance_value", sa.String(length=12))
    _alter_column_type(columns, "rate_line_no", sa.String(length=2))
    _alter_column_type(columns, "rate", sa.Numeric(14, 2))
    _alter_column_type(columns, "dimensions", sa.String(length=65))
    _alter_column_type(columns, "slac", sa.String(length=4))
    _alter_column_type(columns, "hs_code", sa.String(length=18))
    _alter_column_type(columns, "country_of_origin", sa.String(length=2))
    _alter_column_type(columns, "other_charge_code", sa.String(length=10))
    _alter_column_type(columns, "entitlement", sa.String(length=10))
    _alter_column_type(columns, "amount", sa.Numeric(14, 2))
    _alter_column_type(columns, "prepaid_weight_charge", sa.Numeric(14, 2))
    _alter_column_type(columns, "prepaid_other_charge", sa.Numeric(14, 2))
    _alter_column_type(columns, "total_prepaid", sa.Numeric(14, 2))
    _alter_column_type(columns, "collect_charge", sa.Numeric(14, 2))
    _alter_column_type(columns, "shipper_certification", sa.String(length=20))
    _alter_column_type(columns, "issue_place", sa.String(length=17))
    _alter_column_type(columns, "issued_by", sa.String(length=20))
    _alter_column_type(columns, "special_handling_code", sa.String(length=3))
    _alter_column_type(columns, "ssr", sa.String(length=65))
    _alter_column_type(columns, "osi", sa.String(length=65))
    _alter_column_type(columns, "oci", sa.String(length=65))


def downgrade() -> None:
    """Revert fwb column normalization."""
    columns = _get_columns(TABLE_NAME)
    if not columns:
        return

    _alter_column_type(columns, "shipper_name", sa.String(length=200))
    _alter_column_type(columns, "shipper_address", sa.Text())
    _alter_column_type(columns, "consignee_name", sa.String(length=200))
    _alter_column_type(columns, "consignee_address", sa.Text())
    _alter_column_type(columns, "flight_no", sa.String(length=20))
    _alter_column_type(columns, "origin", sa.String(length=10))
    _alter_column_type(columns, "destination", sa.String(length=10))
    _alter_column_type(columns, "routing", sa.String(length=200))
    _alter_column_type(columns, "weight", sa.Numeric(10, 2))
    _alter_column_type(columns, "volume", sa.Numeric(10, 2))
    _alter_column_type(columns, "goods_description", sa.Text())
    _alter_column_type(columns, "chargeable_weight", sa.Numeric(10, 2))
    _alter_column_type(columns, "rate_class", sa.String(length=10))
    _alter_column_type(columns, "total_charge", sa.Numeric(10, 2))
    _alter_column_type(columns, "message_type", sa.String(length=10))
    _alter_column_type(columns, "message_version", sa.String(length=10))
    _alter_column_type(columns, "awb_prefix", sa.String(length=10))
    _alter_column_type(columns, "awb_number", sa.String(length=20))
    _alter_column_type(columns, "shipment_description_code", sa.String(length=5))
    _alter_column_type(columns, "weight_unit", sa.String(length=5))
    _alter_column_type(columns, "gross_weight", sa.Numeric(10, 2))
    _alter_column_type(columns, "routing_list", sa.Text())
    _alter_column_type(columns, "first_carrier", sa.String(length=10))
    _alter_column_type(columns, "onward_carrier", sa.String(length=10))
    _alter_column_type(columns, "flight_number", sa.String(length=20))
    _alter_column_type(columns, "flight_carrier", sa.String(length=10))
    _alter_column_type(columns, "shipper_city", sa.String(length=100))
    _alter_column_type(columns, "shipper_state", sa.String(length=100))
    _alter_column_type(columns, "shipper_country", sa.String(length=10))
    _alter_column_type(columns, "shipper_postcode", sa.String(length=20))
    _alter_column_type(columns, "shipper_contact", sa.String(length=100))
    _alter_column_type(columns, "consignee_city", sa.String(length=100))
    _alter_column_type(columns, "consignee_state", sa.String(length=100))
    _alter_column_type(columns, "consignee_country", sa.String(length=10))
    _alter_column_type(columns, "consignee_postcode", sa.String(length=20))
    _alter_column_type(columns, "consignee_contact", sa.String(length=100))
    _alter_column_type(columns, "agent_iata_code", sa.String(length=20))
    _alter_column_type(columns, "agent_account", sa.String(length=50))
    _alter_column_type(columns, "agent_name", sa.String(length=200))
    _alter_column_type(columns, "agent_city", sa.String(length=100))
    _alter_column_type(columns, "currency", sa.String(length=10))
    _alter_column_type(columns, "charge_code", sa.String(length=10))
    _alter_column_type(columns, "weight_charge_pp_cc", sa.String(length=5))
    _alter_column_type(columns, "other_charge_pp_cc", sa.String(length=5))
    _alter_column_type(columns, "declared_value_carriage", sa.String(length=20))
    _alter_column_type(columns, "declared_value_customs", sa.String(length=20))
    _alter_column_type(columns, "insurance_value", sa.String(length=20))
    _alter_column_type(columns, "rate_line_no", sa.String(length=20))
    _alter_column_type(columns, "rate", sa.Numeric(12, 2))
    _alter_column_type(columns, "dimensions", sa.String(length=100))
    _alter_column_type(columns, "slac", sa.String(length=20))
    _alter_column_type(columns, "hs_code", sa.String(length=20))
    _alter_column_type(columns, "country_of_origin", sa.String(length=10))
    _alter_column_type(columns, "other_charge_code", sa.String(length=20))
    _alter_column_type(columns, "amount", sa.Numeric(12, 2))
    _alter_column_type(columns, "prepaid_weight_charge", sa.Numeric(12, 2))
    _alter_column_type(columns, "prepaid_other_charge", sa.Numeric(12, 2))
    _alter_column_type(columns, "total_prepaid", sa.Numeric(12, 2))
    _alter_column_type(columns, "collect_charge", sa.Numeric(12, 2))
    _alter_column_type(columns, "shipper_certification", sa.String(length=200))
    _alter_column_type(columns, "issue_place", sa.String(length=100))
    _alter_column_type(columns, "issued_by", sa.String(length=100))
    _alter_column_type(columns, "special_handling_code", sa.String(length=20))
    _alter_column_type(columns, "ssr", sa.Text())
    _alter_column_type(columns, "osi", sa.Text())
    _alter_column_type(columns, "oci", sa.Text())

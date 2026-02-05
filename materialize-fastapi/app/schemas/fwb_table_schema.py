from datetime import date, datetime

from pydantic import BaseModel


class FwbTableOut(BaseModel):
    id: int
    mawb: str

    shipper_name: str | None = None
    shipper_address: str | None = None
    consignee_name: str | None = None
    consignee_address: str | None = None

    flight_no: str | None = None
    flight_date: datetime | None = None
    origin: str | None = None
    destination: str | None = None
    routing: str | None = None

    pieces: int | None = None
    weight: float | None = None
    volume: float | None = None
    goods_description: str | None = None

    chargeable_weight: float | None = None
    rate_class: str | None = None
    total_charge: float | None = None
    raw_message: str | None = None

    message_type: str | None = None
    message_version: str | None = None
    awb_prefix: str | None = None
    awb_number: str | None = None
    shipment_description_code: str | None = None
    total_pieces: int | None = None
    weight_unit: str | None = None
    gross_weight: float | None = None
    routing_list: str | None = None
    first_carrier: str | None = None
    onward_carrier: str | None = None
    flight_number: str | None = None
    flight_carrier: str | None = None
    shipper_city: str | None = None
    shipper_state: str | None = None
    shipper_country: str | None = None
    shipper_postcode: str | None = None
    shipper_contact: str | None = None
    consignee_city: str | None = None
    consignee_state: str | None = None
    consignee_country: str | None = None
    consignee_postcode: str | None = None
    consignee_contact: str | None = None
    agent_iata_code: str | None = None
    agent_account: str | None = None
    agent_name: str | None = None
    agent_city: str | None = None
    currency: str | None = None
    charge_code: str | None = None
    weight_charge_pp_cc: str | None = None
    other_charge_pp_cc: str | None = None
    declared_value_carriage: str | None = None
    declared_value_customs: str | None = None
    insurance_value: str | None = None
    rate_line_no: str | None = None
    rate: float | None = None
    dimensions: str | None = None
    slac: str | None = None
    hs_code: str | None = None
    country_of_origin: str | None = None
    other_charge_code: str | None = None
    entitlement: str | None = None
    amount: float | None = None
    prepaid_weight_charge: float | None = None
    prepaid_other_charge: float | None = None
    total_prepaid: float | None = None
    collect_charge: float | None = None
    shipper_certification: str | None = None
    issue_date: date | None = None
    issue_place: str | None = None
    issued_by: str | None = None
    special_handling_code: str | None = None
    ssr: str | None = None
    osi: str | None = None
    oci: str | None = None

    created_at: datetime | None = None

    model_config = {"from_attributes": True}

# ruff: noqa: N815

from datetime import datetime

from pydantic import BaseModel


class ImpHostAWBBase(BaseModel):
    MasterAWB: str | None = None
    HostAWB: str | None = None
    tglAWB: str | None = None
    tglMasterAWB: str | None = None
    Quantity: int | None = None
    Weight: float | None = None
    Volume: float | None = None
    airlinescode: str | None = None
    FlightNo: str | None = None
    DateOfFlight: str | None = None
    Origin: str | None = None
    HSCode: str | None = None
    DescriptionGoods: str | None = None
    AgenCode: str | None = None
    ShipperCode: str | None = None
    shippername: str | None = None
    shipperaddress: str | None = None
    shippercity: str | None = None
    shippercountry: str | None = None
    shipperpostal: str | None = None
    ConsigneeCode: str | None = None
    Consigneename: str | None = None
    Consigneeaddress: str | None = None
    Consigneecity: str | None = None
    Consigneecountry: str | None = None
    Consigneepostal: str | None = None
    ConsigneeTaxNo: str | None = None
    bc11: str | None = None
    tglbc: str | None = None
    nopos: str | None = None
    subpos: str | None = None
    subsubpos: str | None = None
    noplp: str | None = None
    tglplp: str | None = None
    typeClearance: str | None = None
    SPPB: str | None = None
    TGLSPPB: str | None = None
    LOCATION: str | None = None
    DateOfOut: str | None = None
    TimeOut: str | None = None
    DateOfIn: str | None = None
    TimeIn: str | None = None
    BagNumber: str | None = None
    DateEntry: str | None = None
    TimeEntry: str | None = None
    flagDO: int | None = None
    void: int | None = None
    token: str | None = None
    flag_in: int | None = None
    flag_out: int | None = None
    RCF: bool | int | None = None
    TFD: bool | int | None = None
    DLV: bool | int | None = None


class ImpHostAWBOut(ImpHostAWBBase):
    noid: int
    created_at: datetime

    model_config = {"from_attributes": True}

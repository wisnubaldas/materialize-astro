from datetime import datetime

from pydantic import BaseModel


class EksHostAWBBase(BaseModel):
    MasterAWB: str | None = None
    HostAWB: str | None = None
    kd_kemasan: str | None = None
    Quantity: int | None = None
    Weight: float | None = None
    Volume: float | None = None
    airlinescode: str | None = None
    FlightNo: str | None = None
    DateOfFlight: str | None = None

    kd_doc: str | None = "6"
    PENnumber: str | None = None
    KTKR: str | None = None
    DateOfPen: str | None = None
    HSCode: str | None = None
    descriptiongoods: str | None = None

    AgenCode: str | None = None
    ShipperCode: str | None = None

    shippername: str | None = None
    shipperaddress: str | None = None
    shippercity: str | None = None
    shippercountry: str | None = None
    shipperpostal: str | None = None
    shipperTaxNo: str | None = None  # noqa: N815

    ConsigneeCode: str | None = None
    Consigneename: str | None = None
    Consigneeaddress: str | None = None
    Consigneecity: str | None = None
    Consigneecountry: str | None = None

    bc11: str | None = None
    tglbc: str | None = None
    nopos: str | None = None
    subpos: str | None = None
    subsubpos: str | None = None

    DateOfOut: str | None = None
    TimeOut: str | None = None
    DateOfIn: str | None = None
    TimeIn: str | None = None

    FHL: int | None = 0
    Status: int | None = 0
    DateEntry: str | None = None
    TimeEntry: str | None = None
    void: int | None = 0
    token: str | None = None


class EksHostAWBCreate(EksHostAWBBase):
    pass


class EksHostAWBUpdate(EksHostAWBBase):
    pass


class EksHostAWBOut(EksHostAWBBase):
    noid: int
    created_at: datetime

    model_config = {"from_attributes": True}

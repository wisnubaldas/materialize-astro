from sqlalchemy import TIMESTAMP, BigInteger, Boolean, Column, Float, Integer, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2


class EksBuildupHeader(BaseDB2):
    __tablename__ = "eks_buildupheader"

    noid = Column(BigInteger, primary_key=True, autoincrement=True)

    buildup_number = Column("BuildupNumber", String(18), nullable=False)
    airlines_code = Column("AirlinesCode", String(2))
    flight_number = Column("FlightNumber", String(8))
    destination_code = Column("DestinationCode", String(6))

    date_of_flight = Column("DateOfFlight", String(10))
    aircraft_registration = Column("AircraftRegistration", String(15))

    etd = Column("EstimateTimeDeparture", String(5))
    time_departure = Column("TimeDeparture", String(5))

    total_master_awb = Column("TotalMasterAWB", Integer)
    part_of_pieces = Column("PartOfPieces", Integer)
    total_pieces = Column("TotalPieces", Integer)

    part_of_netto = Column("PartOfNetto", Float)
    total_netto = Column("TotalNetto", Float)
    total_volume = Column("TotalVolume", Float)

    employee_number = Column("EmployeeNumber", String(10))
    operator_name = Column("OperatorName", String(30))

    date_entry = Column("DateEntry", String(10))
    time_entry = Column("TimeEntry", String(8))

    void = Column("void", Boolean, default=False)

    ffm_message_key = Column("ffm_MessageKey", String(50), default="0")

    token = Column("token", String(5))
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

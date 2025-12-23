from sqlalchemy import TIMESTAMP, BigInteger, Boolean, Column, Float, Integer, String
from sqlalchemy.sql import func

from app.db.mysql import BaseDB2  # sesuaikan dengan project Anda


class EksBuildupDetail(BaseDB2):
    __tablename__ = "eks_buildupdetail"

    noid = Column(BigInteger, primary_key=True, autoincrement=True)
    buildup_number = Column("BuildUpNumber", String(18))
    master_awb = Column("MasterAWB", String(15))
    parsial = Column("Parsial", String(1))
    transit_code = Column("TransitCode", String(3))

    part_pieces = Column("PartPieces", Integer)
    pieces = Column("Pieces", Integer)

    part_netto = Column("PartNetto", Float)
    netto = Column("Netto", Float)
    volume = Column("Volume", Float)

    uld_card_number = Column("UldCardNumber", String(15))
    kind_of_good = Column("KindOfGood", String(50))

    employee_number = Column("EmployeeNumber", String(10))
    agen_code = Column("AgenCode", String(19))
    condition = Column("condition", String(50))
    overload_code = Column("OverLoadCode", String(1))

    do_number = Column("DONumber", String(18))
    remarks = Column("Remarks", String(25))
    official_use = Column("OfficialUse", String(25))

    print_number = Column("PrintNumber", Integer, default=0)

    date_entry = Column("DateEntry", String(10))
    time_entry = Column("TimeEntry", String(8))

    ffm = Column("FFM", Boolean, default=False)
    void = Column("void", Boolean, default=False)

    token = Column("token", String(5), default="71901")
    created_at = Column(TIMESTAMP, server_default=func.current_timestamp())

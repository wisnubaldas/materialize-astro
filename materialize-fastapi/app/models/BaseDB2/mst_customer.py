from datetime import datetime

from sqlalchemy import TIMESTAMP, BigInteger, Boolean, Column, String

from app.db.mysql import BaseDB2


class MstCustomer(BaseDB2):
    __tablename__ = "mst_customer"

    _id = Column(BigInteger, primary_key=True, autoincrement=True)
    CustomerCode = Column(String(20), nullable=False)  # Part of composite PK
    CompanyName = Column(String(100))
    PICName = Column(String(50))
    Address1 = Column(String(60))
    Address2 = Column(String(60))
    City = Column(String(50))
    PostCode = Column(String(8))
    CountryCode = Column(String(2))
    MobileNumber = Column(String(20))
    FaxNumber = Column(String(20))
    Phonenumber = Column(String(20))
    EmailAddress = Column(String(75))
    NPWPNumber = Column(String(25))
    ContactIdentifier = Column(String(3))
    ContactNumber = Column(String(50))
    EmployeeNumber = Column(String(10))
    flag_faktur = Column(Boolean, default=False)
    Dom_member = Column(Boolean, default=False)
    int_member = Column(Boolean, default=True)
    DateEntry = Column(String(10))
    TimeEntry = Column(String(8))
    void = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

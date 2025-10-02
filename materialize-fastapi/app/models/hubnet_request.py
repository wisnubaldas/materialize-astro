from sqlalchemy import TIMESTAMP, Column, Integer, String, func

from app.db.mysql import BaseDB1


class HubnetRequest(BaseDB1):
    __tablename__ = "hubnet_request"
    id = Column(Integer, primary_key=True, index=True)  # WAJIB ada PK
    AWB_NO = Column(String)
    FLT_NUMBER = Column(String)
    FLT_DATE = Column(String)
    ORI = Column(String)
    DEST = Column(String)
    FLT_NUMBER1 = Column(String)
    FLT_DATE1 = Column(String)
    ORI1 = Column(String)
    T = Column(String)
    K = Column(String)
    CH_WEIGHT = Column(String)
    MC = Column(String)
    AGT_NAME = Column(String)
    AGT_ADD = Column(String)
    SHP_ADD = Column(String)
    SHP_NAME = Column(String)
    CNE_NAME = Column(String)
    CNE_ADD = Column(String)
    KATEGORI_CARGO = Column(String)
    COMMODITY = Column(String)
    CARGO_TREATMENT = Column(String)
    REMARKS = Column(String)
    IS_INTERNATIONAL = Column(String)
    IS_EKSPOR = Column(String)
    IS_SEND = Column(String, default="0")
    IS_FAILED = Column(String, default="0")
    ERROR_MESSAGE = Column(String, default="NULL")
    IS_SUCCESS = Column(String, default="0")
    SUCCESS_MESSAGE = Column(String, default="NULL")
    IS_BREAK = Column(String, default="0")
    BREAK_MESSAGE = Column(String, default="NULL")
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

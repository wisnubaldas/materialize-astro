from sqlalchemy import Column, Integer, String

from app.db.mysql import BaseDB1


class HubnetResponse(BaseDB1):
    __tablename__ = "hubnet_response"
    id = Column(Integer, primary_key=True, index=True)  # WAJIB ada PK
    status = Column(String)
    message = Column(String)
    ref_id = Column(String)

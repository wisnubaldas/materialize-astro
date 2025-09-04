from sqlalchemy import Column, Integer, String
from app.db.mysql import Base
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    token = Column(String(255), nullable=True)
    refresh_token = Column(String(255), nullable=True)

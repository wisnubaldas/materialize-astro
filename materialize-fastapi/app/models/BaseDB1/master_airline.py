from sqlalchemy import Column, Integer, String, JSON, Enum, DateTime
from sqlalchemy.sql import func

from app.db.mysql import BaseDB1


class MasterAirline(BaseDB1):
    """
    SQLAlchemy model representing the master_airlines table.
    
    Attributes:
        id (int): Primary key.
        iata_code (str): IATA code of the airline.
        icao_code (str): ICAO code of the airline.
        airline_name (str): Full name of the airline.
        short_name (str): Short/common name of the airline.
        country (str): Country of origin.
        awb_prefix (str): AWB prefix (3 digits).
        home_base (str): Home airport code.
        cargo_handling_agent (str): Cargo handling agent.
        sitatex_address (str): SITATEX address.
        edi_support (dict): JSON configuration for EDI support.
        special_handling_codes (dict): JSON configuration for special handling codes.
        allowed_uld_types (dict): JSON configuration for allowed ULD types.
        contact_person (str): Contact person name.
        contact_email (str): Contact email address.
        contact_phone (str): Contact phone number.
        status (str): ACTIVE or INACTIVE.
        created_at (datetime): Timestamp when record was created.
        updated_at (datetime): Timestamp when record was last updated.
    """
    __tablename__ = "master_airlines"

    id = Column(Integer, primary_key=True, autoincrement=True)
    iata_code = Column(String(length=5), nullable=True)
    icao_code = Column(String(length=5), nullable=True)
    airline_name = Column(String(length=100), nullable=False)
    short_name = Column(String(length=50), nullable=True)
    country = Column(String(length=100), nullable=True)
    awb_prefix = Column(String(length=10), nullable=True)
    home_base = Column(String(length=10), nullable=True)
    cargo_handling_agent = Column(String(length=100), nullable=True)
    sitatex_address = Column(String(length=50), nullable=True)
    edi_support = Column(JSON, nullable=True)
    special_handling_codes = Column(JSON, nullable=True)
    allowed_uld_types = Column(JSON, nullable=True)
    contact_person = Column(String(length=100), nullable=True)
    contact_email = Column(String(length=100), nullable=True)
    contact_phone = Column(String(length=50), nullable=True)
    status = Column(Enum("ACTIVE", "INACTIVE", name="airline_status"), nullable=False, default="ACTIVE")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

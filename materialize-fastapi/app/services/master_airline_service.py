from datetime import datetime

from app.models.BaseDB1.master_airline import MasterAirline
from app.repositories.master_airline_repository import MasterAirlineRepository
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.master_airline_schema import (
    MasterAirlineCreate,
    MasterAirlineOut,
    MasterAirlineUpdate,
)


class MasterAirlineService:
    """
    Service class containing business logic for Master Airlines operations.
    """

    def __init__(self, repo: MasterAirlineRepository):
        """
        Initialize the service with repository.

        Args:
            repo (MasterAirlineRepository): Master Airlines repository instance.
        """
        self.repository = repo

    def list_all(self) -> list[MasterAirline]:
        """
        List all airlines.

        Returns:
            list[MasterAirline]: List of airline model instances.
        """
        return self.repository.list_all()

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[MasterAirlineOut]:
        """
        Fetch DataTables compatible paginated/filtered list of airlines.

        Args:
            params (DataTablesParams): Query parameters from datatable client.

        Returns:
            DataTablesResponse[MasterAirlineOut]: Paginated datatable response.
        """
        return self.repository.datatable(params)

    def get_by_id(self, airline_id: int) -> MasterAirline | None:
        """
        Get an airline by its ID.

        Args:
            airline_id (int): Primary key ID.

        Returns:
            MasterAirline | None: Airline instance if found, else None.
        """
        return self.repository.get_by_id(airline_id)

    def get_by_iata(self, iata_code: str) -> MasterAirline | None:
        """
        Get an airline by its IATA code.

        Args:
            iata_code (str): 2-character IATA code.

        Returns:
            MasterAirline | None: Airline instance if found, else None.
        """
        return self.repository.get_by_iata(iata_code)

    def get_by_code(self, code: str) -> MasterAirline | None:
        """
        Get an airline by any of its identifier codes (IATA/ICAO/AWB Prefix).

        Args:
            code (str): Identifier code.

        Returns:
            MasterAirline | None: Airline instance if found, else None.
        """
        return self.repository.get_by_code(code)

    def lookup_email_by_code(self, code: str) -> str | None:
        """
        Lookup contact email for an airline by code or code prefixes.

        Args:
            code (str): Airline code or flight code prefix (e.g. 'GA', 'GA123', '126').

        Returns:
            str | None: Contact email if found, else None.
        """
        if not code:
            return None

        # Clean code
        c = code.strip().upper()

        # 1. Direct lookup by exact code
        airline = self.repository.get_by_code(c)
        if airline and airline.contact_email:
            return airline.contact_email

        # 2. Try prefix matching for flight codes (e.g., flight "GA901" -> first 2 characters "GA")
        if len(c) >= 2:
            prefix_2 = c[:2]
            airline = self.repository.get_by_code(prefix_2)
            if airline and airline.contact_email:
                return airline.contact_email

        # 3. Try prefix matching for 3 characters (e.g., flight "SIA901" -> first 3 characters "SIA")
        if len(c) >= 3:
            prefix_3 = c[:3]
            airline = self.repository.get_by_code(prefix_3)
            if airline and airline.contact_email:
                return airline.contact_email

        return None

    def create(self, payload: MasterAirlineCreate) -> MasterAirline:
        """
        Create a new Master Airline.

        Args:
            payload (MasterAirlineCreate): Request payload for creation.

        Returns:
            MasterAirline: Created airline model instance.
        """
        record = MasterAirline(**payload.model_dump())
        return self.repository.create(record)

    def update(self, record: MasterAirline, payload: MasterAirlineUpdate) -> MasterAirline:
        """
        Update an existing Master Airline.

        Args:
            record (MasterAirline): Existing airline model instance.
            payload (MasterAirlineUpdate): Updates to be applied.

        Returns:
            MasterAirline: Updated airline model instance.
        """
        data = payload.model_dump(exclude_unset=True)
        if not data:
            return record
        for key, value in data.items():
            setattr(record, key, value)
        record.updated_at = datetime.now()
        return self.repository.save(record)

    def delete(self, record: MasterAirline) -> None:
        """
        Delete an airline record.

        Args:
            record (MasterAirline): Airline model instance to delete.
        """
        self.repository.delete(record)

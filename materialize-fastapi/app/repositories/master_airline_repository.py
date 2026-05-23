from sqlalchemy.orm import Session

from app.models.BaseDB1.master_airline import MasterAirline
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.master_airline_schema import MasterAirlineOut
from app.services.datatables_service import DataTablesService


class MasterAirlineRepository:
    """
    Repository class for handling database queries for Master Airlines.
    """

    def __init__(self, db: Session):
        """
        Initialize repository with DB session.

        Args:
            db (Session): SQLAlchemy database session.
        """
        self.db = db
        self.datatable_service = DataTablesService(
            model=MasterAirline,
            schema=MasterAirlineOut,
            search_columns=[
                "iata_code",
                "icao_code",
                "airline_name",
                "short_name",
                "country",
                "awb_prefix",
                "contact_email",
            ],
            custom_filters=["iata_code", "icao_code", "status"],
        )

    def list_all(self) -> list[MasterAirline]:
        """
        Retrieve all airlines ordered by airline_name.

        Returns:
            list[MasterAirline]: A list of all airline records.
        """
        return self.db.query(MasterAirline).order_by(MasterAirline.airline_name.asc()).all()

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[MasterAirlineOut]:
        """
        Fetch paginated, filtered, and sorted airlines list for DataTables.

        Args:
            params (DataTablesParams): Parameters for paging, sorting, filtering.

        Returns:
            DataTablesResponse[MasterAirlineOut]: Response formatted for Datatables.
        """
        return self.datatable_service.get_datatable(db=self.db, params=params)

    def get_by_id(self, airline_id: int) -> MasterAirline | None:
        """
        Retrieve an airline by ID.

        Args:
            airline_id (int): Primary key ID.

        Returns:
            MasterAirline | None: The matching airline record or None.
        """
        return self.db.query(MasterAirline).filter(MasterAirline.id == airline_id).first()

    def get_by_code(self, code: str) -> MasterAirline | None:
        """
        Retrieve an airline by IATA code, ICAO code, or AWB prefix.

        Args:
            code (str): The code to lookup (e.g. 'GA', 'GIA', '126').

        Returns:
            MasterAirline | None: The matching airline record or None.
        """
        if not code:
            return None
        c = code.strip().upper()
        return (
            self.db.query(MasterAirline)
            .filter(
                (MasterAirline.iata_code == c)
                | (MasterAirline.icao_code == c)
                | (MasterAirline.awb_prefix == c)
            )
            .first()
        )

    def get_by_iata(self, iata_code: str) -> MasterAirline | None:
        """
        Retrieve an airline by its exact IATA code.

        Args:
            iata_code (str): 2-character IATA code.

        Returns:
            MasterAirline | None: The matching airline record or None.
        """
        if not iata_code:
            return None
        return (
            self.db.query(MasterAirline)
            .filter(MasterAirline.iata_code == iata_code.strip().upper())
            .first()
        )

    def create(self, record: MasterAirline) -> MasterAirline:
        """
        Create a new airline record.

        Args:
            record (MasterAirline): The model instance to persist.

        Returns:
            MasterAirline: The persisted model instance.
        """
        self.db.add(record)
        return self._commit(record)

    def save(self, record: MasterAirline) -> MasterAirline:
        """
        Save/update an existing airline record.

        Args:
            record (MasterAirline): The model instance to save.

        Returns:
            MasterAirline: The saved model instance.
        """
        return self._commit(record)

    def delete(self, record: MasterAirline) -> None:
        """
        Delete an airline record.

        Args:
            record (MasterAirline): The model instance to delete.
        """
        self.db.delete(record)
        self.db.commit()

    def _commit(self, record: MasterAirline) -> MasterAirline:
        """
        Helper method to commit session transactions.

        Args:
            record (MasterAirline): The model instance.

        Returns:
            MasterAirline: Committed and refreshed record.
        """
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        self.db.refresh(record)
        return record

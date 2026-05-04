from app.repositories.tpsonline_repository import TpsOnlineRepository
from app.schemas.tpsonline_schema import TpsOnlineImpInOut


class TpsOnlineService:
    """Service for TPS Online use-cases."""

    def __init__(self, repository: TpsOnlineRepository):
        self.repository = repository

    def find_imp_in_by_no_bl_awb(self, no_bl_awb: str) -> list[TpsOnlineImpInOut]:
        """Validate input and search import-in rows in TPS Online source."""
        cleaned_no_bl_awb = no_bl_awb.strip()
        if not cleaned_no_bl_awb:
            raise ValueError("Parameter no_bl_awb wajib diisi.")

        return self.repository.find_imp_in_by_no_bl_awb(cleaned_no_bl_awb)

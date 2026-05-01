"""Service layer untuk master data referensi asal barang CEISA."""

from datetime import datetime, timezone

from app.models.BaseDB1.mst_ceisa_reference_origin_goods import MstCeisaReferenceOriginGoods
from app.repositories.ceisa_reference_origin_goods_repository import (
    CeisaReferenceOriginGoodsRepository,
)
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.mst_ceisa_reference_origin_goods_schema import (
    CeisaReferenceOriginGoodsSyncResult,
    MstCeisaReferenceOriginGoodsCreate,
    MstCeisaReferenceOriginGoodsOut,
    MstCeisaReferenceOriginGoodsUpdate,
)
from app.integrations.ceisa.reference_code import CeisaReferenceCodeService


class CeisaReferenceOriginGoodsService:
    """Service domain untuk operasi master referensi asal barang."""

    def __init__(
        self,
        repo: CeisaReferenceOriginGoodsRepository,
        ceisa_reference_service: CeisaReferenceCodeService,
    ):
        """Inisialisasi service."""
        self.repository = repo
        self.ceisa_reference_service = ceisa_reference_service

    def list_all(self) -> list[MstCeisaReferenceOriginGoods]:
        """Ambil semua data referensi asal barang."""
        return self.repository.list_all()

    def datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[MstCeisaReferenceOriginGoodsOut]:
        """Ambil data datatable referensi asal barang."""
        return self.repository.datatable(params)

    def get_by_id(self, record_id: int) -> MstCeisaReferenceOriginGoods | None:
        """Ambil data referensi berdasarkan ID."""
        return self.repository.get_by_id(record_id)

    def get_by_code(self, code: str) -> MstCeisaReferenceOriginGoods | None:
        """Ambil data referensi berdasarkan kode."""
        return self.repository.get_by_code(code)

    def create(self, payload: MstCeisaReferenceOriginGoodsCreate) -> MstCeisaReferenceOriginGoods:
        """Buat data referensi baru."""
        record = MstCeisaReferenceOriginGoods(**payload.model_dump())
        return self.repository.create(record)

    def update(
        self,
        record: MstCeisaReferenceOriginGoods,
        payload: MstCeisaReferenceOriginGoodsUpdate,
    ) -> MstCeisaReferenceOriginGoods:
        """Update data referensi."""
        data = payload.model_dump(exclude_unset=True)
        if not data:
            return record
        for key, value in data.items():
            setattr(record, key, value)
        record.updated_at = datetime.now(timezone.utc)
        return self.repository.save(record)

    def delete(self, record: MstCeisaReferenceOriginGoods) -> None:
        """Hapus data referensi."""
        self.repository.delete(record)

    def sync_from_ceisa(self) -> CeisaReferenceOriginGoodsSyncResult:
        """Sinkronisasi master referensi dari CEISA."""
        rows = self.ceisa_reference_service.get_reference_origin_goods()
        inserted, updated = self.repository.bulk_upsert(rows)
        return CeisaReferenceOriginGoodsSyncResult(
            inserted=inserted,
            updated=updated,
            total=len(rows),
        )


"""Repository untuk master data referensi asal barang CEISA."""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.BaseDB1.mst_ceisa_reference_origin_goods import MstCeisaReferenceOriginGoods
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.mst_ceisa_reference_origin_goods_schema import MstCeisaReferenceOriginGoodsOut
from app.services.datatables_service import DataTablesService


class CeisaReferenceOriginGoodsRepository:
    """Akses data master referensi asal barang di DB1."""

    def __init__(self, db: Session):
        """Inisialisasi repository."""
        self.db = db
        self.datatable_service = DataTablesService(
            model=MstCeisaReferenceOriginGoods,
            schema=MstCeisaReferenceOriginGoodsOut,
            search_columns=["code", "name", "description"],
            custom_filters=["code", "name", "is_active"],
        )

    def list_all(self) -> list[MstCeisaReferenceOriginGoods]:
        """Ambil semua data referensi asal barang."""
        return (
            self.db.query(MstCeisaReferenceOriginGoods)
            .order_by(MstCeisaReferenceOriginGoods.code.asc())
            .all()
        )

    def datatable(
        self, params: DataTablesParams
    ) -> DataTablesResponse[MstCeisaReferenceOriginGoodsOut]:
        """Ambil data datatable referensi asal barang."""
        return self.datatable_service.get_datatable(db=self.db, params=params)

    def get_by_id(self, record_id: int) -> MstCeisaReferenceOriginGoods | None:
        """Ambil data referensi berdasarkan ID."""
        return (
            self.db.query(MstCeisaReferenceOriginGoods)
            .filter(MstCeisaReferenceOriginGoods.id == record_id)
            .first()
        )

    def get_by_code(self, code: str) -> MstCeisaReferenceOriginGoods | None:
        """Ambil data referensi berdasarkan kode."""
        return (
            self.db.query(MstCeisaReferenceOriginGoods)
            .filter(MstCeisaReferenceOriginGoods.code == code)
            .first()
        )

    def create(self, record: MstCeisaReferenceOriginGoods) -> MstCeisaReferenceOriginGoods:
        """Buat data referensi baru."""
        self.db.add(record)
        return self._commit(record)

    def save(self, record: MstCeisaReferenceOriginGoods) -> MstCeisaReferenceOriginGoods:
        """Simpan perubahan data referensi."""
        return self._commit(record)

    def delete(self, record: MstCeisaReferenceOriginGoods) -> None:
        """Hapus data referensi."""
        self.db.delete(record)
        self.db.commit()

    def bulk_upsert(self, rows: list[dict[str, str]]) -> tuple[int, int]:
        """Upsert kumpulan data referensi berdasarkan `code`."""
        if not rows:
            return 0, 0

        now = datetime.now(timezone.utc)
        row_by_code = {row["code"]: row for row in rows}
        existing = (
            self.db.query(MstCeisaReferenceOriginGoods)
            .filter(MstCeisaReferenceOriginGoods.code.in_(list(row_by_code.keys())))
            .all()
        )
        existing_by_code = {item.code: item for item in existing}

        inserted = 0
        updated = 0

        for code, row in row_by_code.items():
            record = existing_by_code.get(code)
            if record is None:
                self.db.add(
                    MstCeisaReferenceOriginGoods(
                        code=code,
                        name=row["name"],
                        description=row.get("description"),
                        is_active=True,
                        last_synced_at=now,
                    )
                )
                inserted += 1
                continue

            record.name = row["name"]
            record.description = row.get("description")
            record.is_active = True
            record.last_synced_at = now
            record.updated_at = now
            updated += 1

        self.db.commit()
        return inserted, updated

    def _commit(self, record: MstCeisaReferenceOriginGoods) -> MstCeisaReferenceOriginGoods:
        """Commit transaksi untuk operasi single-row."""
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
        self.db.refresh(record)
        return record

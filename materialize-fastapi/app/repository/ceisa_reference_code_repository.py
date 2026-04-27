"""Repository untuk master data referensi CEISA lintas kategori."""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.BaseDB1.mst_ceisa_reference_code import MstCeisaReferenceCode
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.mst_ceisa_reference_code_schema import MstCeisaReferenceCodeOut
from app.services.datatables_service import DataTablesService


class CeisaReferenceCodeRepository:
    """Akses data master referensi CEISA di DB1."""

    def __init__(self, db: Session):
        """Inisialisasi repository."""
        self.db = db
        self.datatable_service = DataTablesService(
            model=MstCeisaReferenceCode,
            schema=MstCeisaReferenceCodeOut,
            search_columns=[
                "reference_slug",
                "reference_name",
                "code",
                "name",
                "description",
            ],
            custom_filters=["reference_slug", "reference_name", "code", "name", "is_active"],
        )

    def list_by_reference_slug(self, reference_slug: str) -> list[MstCeisaReferenceCode]:
        """Ambil semua data referensi berdasarkan slug kategori."""
        return (
            self.db.query(MstCeisaReferenceCode)
            .filter(MstCeisaReferenceCode.reference_slug == reference_slug)
            .order_by(MstCeisaReferenceCode.code.asc(), MstCeisaReferenceCode.name.asc())
            .all()
        )

    def datatable(self, params: DataTablesParams) -> DataTablesResponse[MstCeisaReferenceCodeOut]:
        """Ambil data datatable referensi CEISA."""
        return self.datatable_service.get_datatable(db=self.db, params=params)

    def sync_rows(
        self,
        reference_slug: str,
        reference_name: str,
        rows: list[dict[str, str]],
    ) -> tuple[int, int, int, int]:
        """Sinkronisasi data referensi berdasarkan snapshot terbaru."""
        now = datetime.now(timezone.utc)
        deduped_rows = self._dedupe_rows(rows)
        incoming_keys = {(row["code"], row["name"]) for row in deduped_rows}

        existing_rows = (
            self.db.query(MstCeisaReferenceCode)
            .filter(MstCeisaReferenceCode.reference_slug == reference_slug)
            .all()
        )
        existing_map = {(item.code, item.name): item for item in existing_rows}

        inserted = 0
        updated = 0
        deactivated = 0

        for row in deduped_rows:
            code = row["code"]
            name = row["name"]
            key = (code, name)
            record = existing_map.get(key)
            if record is None:
                self.db.add(
                    MstCeisaReferenceCode(
                        reference_slug=reference_slug,
                        reference_name=reference_name,
                        code=code,
                        name=name,
                        description=row.get("description"),
                        doc_url=row.get("doc_url"),
                        source=row.get("source", "CEISA_GITBOOK"),
                        is_active=True,
                        last_synced_at=now,
                    )
                )
                inserted += 1
                continue

            changed = False
            for attr, value in {
                "reference_name": reference_name,
                "description": row.get("description"),
                "doc_url": row.get("doc_url"),
                "source": row.get("source", "CEISA_GITBOOK"),
                "is_active": True,
            }.items():
                if getattr(record, attr) != value:
                    setattr(record, attr, value)
                    changed = True
            record.last_synced_at = now
            if changed:
                record.updated_at = now
                updated += 1

        for record in existing_rows:
            key = (record.code, record.name)
            if key in incoming_keys:
                continue
            if record.is_active:
                record.is_active = False
                record.updated_at = now
                deactivated += 1

        self.db.commit()
        total_active = (
            self.db.query(MstCeisaReferenceCode)
            .filter(
                MstCeisaReferenceCode.reference_slug == reference_slug,
                MstCeisaReferenceCode.is_active.is_(True),
            )
            .count()
        )
        return inserted, updated, deactivated, total_active

    @staticmethod
    def _dedupe_rows(rows: list[dict[str, str]]) -> list[dict[str, str]]:
        """Hilangkan duplikasi berdasarkan kombinasi `code` dan `name`."""
        deduped: list[dict[str, str]] = []
        seen: set[tuple[str, str]] = set()
        for row in rows:
            code = str(row.get("code") or "").strip()
            name = str(row.get("name") or "").strip()
            if not code or not name:
                continue
            key = (code, name)
            if key in seen:
                continue
            seen.add(key)
            normalized = dict(row)
            normalized["code"] = code
            normalized["name"] = name
            deduped.append(normalized)
        return deduped

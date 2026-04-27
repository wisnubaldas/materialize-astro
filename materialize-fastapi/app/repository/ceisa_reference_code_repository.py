"""Repository untuk master data referensi CEISA per kategori."""

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.mst_ceisa_reference_code_schema import MstCeisaReferenceCodeOut
from app.services.ceisa.reference_model_registry import (
    CEISA_REFERENCE_MODEL_REGISTRY,
    CeisaReferenceModel,
)
from app.services.datatables_service import DataTablesService


class CeisaReferenceCodeRepository:
    """Akses data master referensi CEISA per kategori di DB1."""

    def __init__(self, db: Session):
        """Inisialisasi repository."""
        self.db = db
        self.datatable_services = {
            reference_slug: DataTablesService(
                model=model,
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
            for reference_slug, model in CEISA_REFERENCE_MODEL_REGISTRY.items()
        }

    def list_by_reference_slug(self, reference_slug: str) -> list[Any]:
        """Ambil semua data referensi berdasarkan slug kategori."""
        model = self._get_model(reference_slug)
        return (
            self.db.query(model)
            .filter(model.reference_slug == reference_slug)
            .order_by(model.code.asc(), model.name.asc())
            .all()
        )

    def datatable(
        self,
        reference_slug: str,
        params: DataTablesParams,
    ) -> DataTablesResponse[MstCeisaReferenceCodeOut]:
        """Ambil data datatable referensi CEISA untuk slug tertentu."""
        _ = self._get_model(reference_slug)
        datatable_service = self.datatable_services[reference_slug]
        return datatable_service.get_datatable(db=self.db, params=params)

    def sync_rows(
        self,
        reference_slug: str,
        reference_name: str,
        rows: list[dict[str, str]],
    ) -> tuple[int, int, int, int]:
        """Sinkronisasi data referensi berdasarkan snapshot terbaru."""
        model = self._get_model(reference_slug)
        now = datetime.now(timezone.utc)
        deduped_rows = self._dedupe_rows(rows)
        incoming_keys = {(row["code"], row["name"]) for row in deduped_rows}

        existing_rows = (
            self.db.query(model)
            .filter(model.reference_slug == reference_slug)
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
                    model(
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
            self.db.query(model)
            .filter(
                model.reference_slug == reference_slug,
                model.is_active.is_(True),
            )
            .count()
        )
        return inserted, updated, deactivated, total_active

    def _get_model(self, reference_slug: str) -> CeisaReferenceModel:
        """Ambil model tabel berdasarkan `reference_slug`."""
        model = CEISA_REFERENCE_MODEL_REGISTRY.get(reference_slug)
        if model is None:
            raise HTTPException(status_code=404, detail="Kategori referensi CEISA tidak didukung")
        return model

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

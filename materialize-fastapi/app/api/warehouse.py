import logging  # noqa: I001
from pathlib import Path

from fastapi import APIRouter, Depends, Form, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.db.mysql import get_db1_w
from app.dependencies.warehouse_deps import (
    get_build_up_draft_service,
    get_warehouse_manifest_service,
    get_warehouse_manifest_service_w,
    get_warehouse_service,
)
from app.schemas.build_up_draft_schema import (
    BuildUpDraftCreate,
    BuildUpDraftOut,
    BuildUpDraftUpdate,
)
from app.schemas.build_up_detail_schema import BuildUpDetailOut
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.export_buildup_schema import ExportBuildupOut
from app.schemas.exp_manifest_flight_schema import ExpManifestFlightOut
from app.schemas.ffm_preview_schema import FfmPreviewOut
from app.schemas.warehouse_masterwaybill_schema import WarehouseMasterWaybillRequest
from app.services.buildup_service import BuildupService
from app.services.warehouse_service import WarehouseService
from app.utils.helper import PDF_DIR

router = APIRouter(prefix="/warehouse", tags=["Warehouse"])
logger = logging.getLogger("warehouse")


@router.post(
    "/manifest-flight",
    summary="Data build up",
    response_model=DataTablesResponse[ExpManifestFlightOut],
)
def manifest_flight_datatables(
    params: DataTablesParams,
    manifest_service: WarehouseService = Depends(get_warehouse_manifest_service),
):
    return manifest_service.manifest_flight_datatable(params)


@router.get(
    "/manifest-flight/{header_id}/details",
    summary="Detail build up berdasarkan header",
    response_model=list[BuildUpDetailOut],
)
def manifest_flight_details(
    header_id: int,
    manifest_service: WarehouseService = Depends(get_warehouse_manifest_service),
):
    return manifest_service.manifest_flight_details(header_id)


@router.delete(
    "/manifest-flight/{header_id}",
    summary="Hapus data build up berdasarkan header",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_manifest_flight(
    header_id: int,
    manifest_service: WarehouseService = Depends(get_warehouse_manifest_service_w),
):
    deleted, pdf_link = manifest_service.delete_manifest_flight(header_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Data build up tidak ditemukan")

    if pdf_link:
        pdf_filename = Path(str(pdf_link)).name
        if pdf_filename:
            pdf_path = PDF_DIR / pdf_filename
            if pdf_path.exists():
                try:
                    pdf_path.unlink()
                except OSError:
                    logger.warning("Gagal menghapus file PDF build up: %s", pdf_path)

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/build-up-drafts",
    summary="Daftar draft BuildUp",
    response_model=list[BuildUpDraftOut],
)
def list_build_up_drafts(
    service: WarehouseService = Depends(get_build_up_draft_service),
):
    return service.list_build_up_drafts()


@router.post(
    "/build-up-drafts",
    summary="Simpan draft BuildUp",
    response_model=BuildUpDraftOut,
    status_code=status.HTTP_201_CREATED,
)
def create_build_up_draft(
    payload: BuildUpDraftCreate,
    service: WarehouseService = Depends(get_build_up_draft_service),
):
    return service.create_build_up_draft(payload)


@router.put(
    "/build-up-drafts/{draft_id}",
    summary="Perbarui draft BuildUp",
    response_model=BuildUpDraftOut,
)
def update_build_up_draft(
    draft_id: int,
    payload: BuildUpDraftUpdate,
    service: WarehouseService = Depends(get_build_up_draft_service),
):
    try:
        return service.update_build_up_draft(draft_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete(
    "/build-up-drafts/{draft_id}",
    summary="Hapus draft BuildUp",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_build_up_draft(
    draft_id: int,
    service: WarehouseService = Depends(get_build_up_draft_service),
):
    try:
        service.delete_build_up_draft(draft_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get(
    "/manifest-flight/{header_id}/ffm-preview",
    summary="Generate preview FFM Cargo-IMP dari data build_up_header + build_up_detail",
    response_model=FfmPreviewOut,
)
def manifest_flight_ffm_preview(
    header_id: int,
    manifest_service: WarehouseService = Depends(get_warehouse_manifest_service),
):
    try:
        return manifest_service.generate_ffm_preview(header_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/submit-fedex-manifest", summary="Submit manifest Fedex dari payload")
def submit_fedex_manifest(
    payload_json: str = Form(...),
    db: Session = Depends(get_db1_w),
):
    return BuildupService.submit_manifest(payload_json=payload_json, db=db)


@router.post(
    "/masterwaybill/bulk",
    summary="Cari data buildup export/domestic outgoing berdasarkan beberapa MasterAWB",
    response_model=list[ExportBuildupOut],
)
def get_masterwaybill_bulk(
    payload: WarehouseMasterWaybillRequest,
    service: WarehouseService = Depends(get_warehouse_service),
):
    """Lookup multiple MasterAWB values from export + domestic outgoing SQL."""
    try:
        return service.get_masterwaybills_by_awb(payload.MasterAWB)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

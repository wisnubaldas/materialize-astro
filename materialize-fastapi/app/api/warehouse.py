import logging

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session, selectinload

from app.db.mysql import get_db1_r, get_db1_w
from app.dependencies.warehouse_deps import get_warehouse_service
from app.models.BaseDB1.exp_manifest_fligt import ExpManifestFligt
from app.models.BaseDB1.exp_manifest_uld import ExpManifestUld
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.eks_masterwaybill import EksMasterWaybillOut
from app.schemas.exp_manifest_flight_detail_schema import (
    ExpManifestFlightDetailResponse,
    ExpManifestFlightDetailRow,
)
from app.schemas.exp_manifest_flight_schema import ExpManifestFlightOut
from app.schemas.warehouse_masterwaybill_schema import WarehouseMasterWaybillRequest
from app.services.datatables_service import DataTablesService
from app.services.warehouse_manifest_service import AirlineManifestUploadService
from app.services.warehouse_service import WarehouseService

router = APIRouter(prefix="/warehouse", tags=["Warehouse"])
logger = logging.getLogger("warehouse")

manifest_flight_datatable_service = DataTablesService(
    model=ExpManifestFligt,
    schema=ExpManifestFlightOut,
    search_columns=[
        "airline_code",
        "flight_number",
        "flight_date",
        "point_of_loading",
        "point_of_unloading",
        "source_document",
    ],
    custom_filters=[
        "airline_code",
        "flight_number",
        "flight_date",
        "point_of_loading",
        "point_of_unloading",
    ],
)


@router.post(
    "/manifest-flight",
    summary="Data manifest flight",
    response_model=DataTablesResponse[ExpManifestFlightOut],
)
def manifest_flight_datatables(params: DataTablesParams, db: Session = Depends(get_db1_r)):
    return manifest_flight_datatable_service.get_datatable(db=db, params=params)


@router.get(
    "/manifest-flight/{flight_id}",
    summary="Detail manifest flight",
    response_model=ExpManifestFlightDetailResponse,
)
def manifest_flight_detail(flight_id: int, db: Session = Depends(get_db1_r)):
    flight = (
        db.query(ExpManifestFligt)
        .options(selectinload(ExpManifestFligt.ulds).selectinload(ExpManifestUld.mawbs))
        .filter(ExpManifestFligt.id == flight_id)
        .first()
    )
    if not flight:
        raise HTTPException(status_code=404, detail="Manifest flight tidak ditemukan")

    rows: list[ExpManifestFlightDetailRow] = []
    for uld in flight.ulds:
        if uld.mawbs:
            for mawb in uld.mawbs:
                rows.append(
                    ExpManifestFlightDetailRow(
                        uld_type=uld.uld_type,
                        uld_number=uld.uld_number,
                        uld_owner=uld.uld_owner,
                        destination=uld.destination,
                        remarks=uld.remarks,
                        mawb_prefix=mawb.mawb_prefix,
                        mawb_number=mawb.mawb_number,
                        pieces=mawb.pieces,
                        weight_kg=float(mawb.weight_kg) if mawb.weight_kg is not None else None,
                        nature_of_goods=mawb.nature_of_goods,
                        route=mawb.route,
                        transit_flag=mawb.transit_flag,
                    )
                )
        else:
            rows.append(
                ExpManifestFlightDetailRow(
                    uld_type=uld.uld_type,
                    uld_number=uld.uld_number,
                    uld_owner=uld.uld_owner,
                    destination=uld.destination,
                    remarks=uld.remarks,
                )
            )

    return ExpManifestFlightDetailResponse(
        flight=ExpManifestFlightOut.model_validate(flight),
        details=rows,
    )


@router.post("/upload-fedex-manifest", summary="Upload manifest Fedex via Excel")
def upload_fedex_manifest(
    file: UploadFile | None = File(default=None),
    payload_json: str | None = Form(default=None),
    db: Session = Depends(get_db1_w),
):
    return AirlineManifestUploadService.upload_manifest(
        file=file, payload_json=payload_json, db=db
    )


@router.post(
    "/masterwaybill/bulk",
    summary="Cari data eks_masterwaybill berdasarkan beberapa MasterAWB",
    response_model=list[EksMasterWaybillOut],
)
def get_masterwaybill_bulk(
    payload: WarehouseMasterWaybillRequest,
    service: WarehouseService = Depends(get_warehouse_service),
):
    """Lookup multiple MasterAWB values in BaseDB2 (eks_masterwaybill)."""
    try:
        return service.get_masterwaybills_by_awb(payload.MasterAWB)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

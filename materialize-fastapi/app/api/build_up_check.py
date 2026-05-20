from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth_deps import require_authenticated_user
from app.dependencies.build_up_check_deps import get_build_up_check_service
from app.schemas.build_up_check_schema import (
    BuildUpCheckDetailCreate,
    BuildUpCheckDetailOut,
    BuildUpCheckHeaderCreate,
    BuildUpCheckHeaderOut,
    BuildUpCheckHeaderReopen,
    BuildUpCheckRincianCreate,
    BuildUpMasterAwbSummaryOut,
)
from app.services.build_up_check_service import BuildUpCheckService

router = APIRouter(
    prefix="/warehouse",
    tags=["Mobile Build Up Check"],
    dependencies=[Depends(require_authenticated_user)],
)


@router.get(
    "/build-up-check-headers",
    summary="Daftar header Build Up Check mobile",
    response_model=list[BuildUpCheckHeaderOut],
)
def list_build_up_check_headers(
    flight_date: str | None = None,
    unfinished_only: bool = False,
    completed_only: bool = False,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """List mobile Build Up Check headers with optional completion filters."""
    return service.list_headers(
        flight_date=flight_date,
        unfinished_only=unfinished_only,
        completed_only=completed_only,
    )


@router.get(
    "/build-up-check-headers/master-awb-summary",
    summary="Ringkasan jumlah Master AWB Build Up Check mobile",
    response_model=BuildUpMasterAwbSummaryOut,
)
def get_build_up_master_awb_summary(
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Return mobile dashboard Master AWB summary."""
    return service.get_master_awb_summary()


@router.post(
    "/build-up-check-headers",
    summary="Simpan header Build Up Check mobile",
    response_model=BuildUpCheckHeaderOut,
    status_code=status.HTTP_201_CREATED,
)
def create_build_up_check_header(
    payload: BuildUpCheckHeaderCreate,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Create one mobile Build Up Check header."""
    return service.create_header(payload)


@router.post(
    "/build-up-check-headers/{header_id}/reopen",
    summary="Buka kembali header Build Up Check mobile yang sudah selesai",
    response_model=BuildUpCheckHeaderOut,
)
def reopen_build_up_check_header(
    header_id: int,
    payload: BuildUpCheckHeaderReopen,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Add a new MAWB to an already completed Build Up Check header."""
    try:
        return service.reopen_header(header_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.get(
    "/build-up-check-headers/{header_id}/details",
    summary="Daftar detail Build Up Check mobile",
    response_model=list[BuildUpCheckDetailOut],
)
def list_build_up_check_details(
    header_id: int,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """List MAWB details for one mobile Build Up Check header."""
    try:
        return service.list_details(header_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post(
    "/build-up-check-headers/{header_id}/details",
    summary="Simpan detail Build Up Check mobile",
    response_model=BuildUpCheckDetailOut,
    status_code=status.HTTP_201_CREATED,
)
def create_build_up_check_detail(
    header_id: int,
    payload: BuildUpCheckDetailCreate,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Create a MAWB allocation for one mobile Build Up Check header."""
    try:
        return service.create_detail(header_id=header_id, payload=payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post(
    "/build-up-check-details/{detail_id}/close-allocation",
    summary="Tutup alokasi ULD untuk detail Build Up Check mobile",
    response_model=BuildUpCheckDetailOut,
)
def close_build_up_check_detail_allocation(
    detail_id: int,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Close one ULD allocation using the current entered pieces."""
    try:
        return service.close_detail_allocation(detail_id=detail_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post(
    "/build-up-check-details/{detail_id}/rincian",
    summary="Simpan rincian Build Up Check mobile",
    response_model=BuildUpCheckDetailOut,
    status_code=status.HTTP_201_CREATED,
)
def create_build_up_check_rincian(
    detail_id: int,
    payload: BuildUpCheckRincianCreate,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Create one pieces/weight row for a mobile Build Up Check detail."""
    try:
        return service.create_rincian(detail_id=detail_id, payload=payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc

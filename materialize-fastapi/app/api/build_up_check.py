from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import FileResponse

from app.api.middleware.auth_middleware import decode_token
from app.dependencies.auth_deps import require_authenticated_user
from app.dependencies.build_up_check_deps import get_build_up_check_service
from app.schemas.build_up_check_schema import (
    BuildUpCheckDetailCreate,
    BuildUpCheckDetailOut,
    BuildUpCheckHeaderCreate,
    BuildUpCheckHeaderOut,
    BuildUpCheckRincianCreate,
    BuildUpMasterAwbSummaryOut,
    BuildUpPdfPrepareOut,
)
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
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
    "/build-up-check-headers/{header_id}/close",
    summary="Tutup manual Build Up ULD mobile",
    response_model=BuildUpCheckHeaderOut,
)
def close_build_up_check_header(
    header_id: int,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Close one Build Up ULD header manually."""
    try:
        return service.close_header(header_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@router.post(
    "/build-up-check-headers/{header_id}/open",
    summary="Buka manual Build Up ULD mobile",
    response_model=BuildUpCheckHeaderOut,
)
def open_build_up_check_header(
    header_id: int,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Open one closed Build Up ULD header manually."""
    try:
        return service.open_header(header_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


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


@router.post(
    "/build-up-headers/datatables",
    summary="Daftar Build Up Header untuk server-side Datatables",
    response_model=DataTablesResponse[BuildUpCheckHeaderOut],
)
def get_build_up_headers_datatables(
    payload: DataTablesParams,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Return a server-side paginated list of Build Up headers."""
    return service.build_up_headers_datatable(payload)


@router.post(
    "/build-up-check-headers/{header_id}/pdf-manifest/prepare",
    summary="Generate manifest PDF Build Up di backend",
    response_model=BuildUpPdfPrepareOut,
)
def prepare_build_up_manifest_pdf(
    header_id: int,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Generate grouped Build Up manifest PDF before opening a browser tab."""
    try:
        return service.prepare_build_up_manifest_pdf(header_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post(
    "/build-up-check-headers/{header_id}/pdf-checklist/prepare",
    summary="Generate checklist PDF Build Up di backend",
    response_model=BuildUpPdfPrepareOut,
)
def prepare_build_up_checklist_pdf(
    header_id: int,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Generate one-ULD Build Up checklist PDF before opening a browser tab."""
    try:
        return service.prepare_build_up_checklist_pdf(header_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


pdf_router = APIRouter(
    prefix="/pdf/warehouse",
    tags=["PDF Print"],
)


@pdf_router.get(
    "/build-up-headers/{header_id}/pdf-manifest",
    summary="Cetak manifest PDF Build Up",
)
def print_build_up_manifest(
    header_id: int,
    token: str,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Generate and return Build Up manifest PDF."""
    try:
        decode_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token tidak valid atau kedaluwarsa: {exc!s}",
        ) from exc

    try:
        pdf_bytes = service.generate_build_up_manifest_pdf(header_id=header_id)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=manifest_buildup_{header_id}.pdf"
            },
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@pdf_router.get(
    "/build-up-headers/{header_id}/pdf-checklist",
    summary="Cetak checklist PDF Build Up",
)
def print_build_up_checklist(
    header_id: int,
    token: str,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Generate and return Build Up checklist PDF."""
    try:
        decode_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token tidak valid atau kedaluwarsa: {exc!s}",
        ) from exc

    try:
        pdf_bytes = service.generate_build_up_checklist_pdf(header_id=header_id)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"inline; filename=checklist_buildup_{header_id}.pdf"
            },
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@pdf_router.get(
    "/generated/{filename}",
    summary="Tampilkan PDF Build Up yang sudah digenerate",
)
def view_prepared_build_up_pdf(
    filename: str,
    token: str,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Return a generated Build Up PDF file after query-token validation."""
    try:
        decode_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token tidak valid atau kedaluwarsa: {exc!s}",
        ) from exc

    try:
        pdf_path = service.get_prepared_pdf_path(filename)
        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=filename,
            headers={"Content-Disposition": f"inline; filename={filename}"},
        )
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.delete(
    "/build-up-check-headers/{header_id}",
    summary="Hapus header Build Up Check",
    status_code=status.HTTP_200_OK,
)
def delete_build_up_check_header(
    header_id: int,
    service: BuildUpCheckService = Depends(get_build_up_check_service),
):
    """Hapus header Build Up Check beserta detail dan rincian di dalamnya.

    Args:
        header_id: ID dari header build up check yang ingin dihapus.
        service: Instance dari BuildUpCheckService.

    Returns:
        Dict berisi status sukses dan pesan keberhasilan.
    """
    try:
        service.delete_header(header_id)
        return {"status": "success", "message": "Data build up berhasil dihapus"}
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Gagal menghapus data build up: {exc!s}") from exc

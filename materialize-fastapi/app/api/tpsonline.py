from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.tpsonline_deps import get_tpsonline_service
from app.schemas.tpsonline_schema import TpsOnlineImpInOut
from app.services.tpsonline_service import TpsOnlineService

router = APIRouter(prefix="/tpsonline", tags=["TPS Online"])


@router.get(
    "/imp-in",
    summary="Cari data TPS Online get_imp_in berdasarkan no_bl_awb",
    response_model=list[TpsOnlineImpInOut],
)
def get_imp_in(no_bl_awb: str, service: TpsOnlineService = Depends(get_tpsonline_service)):
    """Search `get_imp_in` rows by `no_bl_awb` using DB3 connection."""
    try:
        result = service.find_imp_in_by_no_bl_awb(no_bl_awb)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not result:
        raise HTTPException(status_code=404, detail="Data tidak ditemukan")

    return result

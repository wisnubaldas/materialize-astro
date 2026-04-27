"""API endpoint untuk master data CEISA."""

from fastapi import APIRouter, Depends, HTTPException, Response, status

from app.dependencies.ceisa_reference_origin_goods_deps import (
    get_ceisa_reference_origin_goods_service_r,
    get_ceisa_reference_origin_goods_service_w,
)
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse
from app.schemas.mst_ceisa_reference_origin_goods_schema import (
    CeisaReferenceOriginGoodsSyncResult,
    MstCeisaReferenceOriginGoodsCreate,
    MstCeisaReferenceOriginGoodsOut,
    MstCeisaReferenceOriginGoodsUpdate,
)
from app.services.ceisa_reference_origin_goods_service import CeisaReferenceOriginGoodsService

router = APIRouter(prefix="/ceisa", tags=["CEISA Master Data"])


@router.get(
    "/reference-codes/referensi-asal-barang",
    summary="List Referensi Asal Barang CEISA",
    response_model=list[MstCeisaReferenceOriginGoodsOut],
)
def list_reference_origin_goods(
    service: CeisaReferenceOriginGoodsService = Depends(get_ceisa_reference_origin_goods_service_r),
):
    """Daftar master referensi asal barang."""
    return service.list_all()


@router.post(
    "/reference-codes/referensi-asal-barang/datatables",
    summary="Datatable Referensi Asal Barang CEISA",
    response_model=DataTablesResponse[MstCeisaReferenceOriginGoodsOut],
)
def datatable_reference_origin_goods(
    params: DataTablesParams,
    service: CeisaReferenceOriginGoodsService = Depends(get_ceisa_reference_origin_goods_service_r),
):
    """Datatable master referensi asal barang."""
    return service.datatable(params)


@router.get(
    "/reference-codes/referensi-asal-barang/{record_id}",
    summary="Detail Referensi Asal Barang CEISA",
    response_model=MstCeisaReferenceOriginGoodsOut,
)
def get_reference_origin_goods(
    record_id: int,
    service: CeisaReferenceOriginGoodsService = Depends(get_ceisa_reference_origin_goods_service_r),
):
    """Ambil detail referensi asal barang."""
    record = service.get_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Referensi asal barang tidak ditemukan")
    return record


@router.post(
    "/reference-codes/referensi-asal-barang",
    summary="Create Referensi Asal Barang CEISA",
    response_model=MstCeisaReferenceOriginGoodsOut,
    status_code=status.HTTP_201_CREATED,
)
def create_reference_origin_goods(
    payload: MstCeisaReferenceOriginGoodsCreate,
    service: CeisaReferenceOriginGoodsService = Depends(get_ceisa_reference_origin_goods_service_w),
):
    """Buat master referensi asal barang baru."""
    code = payload.code.strip()
    if service.get_by_code(code):
        raise HTTPException(status_code=409, detail="Kode referensi asal barang sudah digunakan")

    data = payload.model_dump()
    data["code"] = code
    data["name"] = data["name"].strip()
    data["source"] = data["source"].strip()
    if data.get("description") is not None:
        data["description"] = data["description"].strip() or None

    if not data["code"]:
        raise HTTPException(status_code=400, detail="Kode referensi wajib diisi")
    if not data["name"]:
        raise HTTPException(status_code=400, detail="Nama referensi wajib diisi")
    if not data["source"]:
        raise HTTPException(status_code=400, detail="Sumber referensi wajib diisi")

    return service.create(MstCeisaReferenceOriginGoodsCreate(**data))


@router.put(
    "/reference-codes/referensi-asal-barang/{record_id}",
    summary="Update Referensi Asal Barang CEISA",
    response_model=MstCeisaReferenceOriginGoodsOut,
)
def update_reference_origin_goods(
    record_id: int,
    payload: MstCeisaReferenceOriginGoodsUpdate,
    service: CeisaReferenceOriginGoodsService = Depends(get_ceisa_reference_origin_goods_service_w),
):
    """Update master referensi asal barang."""
    record = service.get_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Referensi asal barang tidak ditemukan")

    data = payload.model_dump(exclude_unset=True)
    if "code" in data:
        code = data["code"].strip()
        if code != record.code and service.get_by_code(code):
            raise HTTPException(
                status_code=409, detail="Kode referensi asal barang sudah digunakan"
            )
        if not code:
            raise HTTPException(status_code=400, detail="Kode referensi wajib diisi")
        data["code"] = code
    if "name" in data:
        name = data["name"].strip()
        if not name:
            raise HTTPException(status_code=400, detail="Nama referensi wajib diisi")
        data["name"] = name
    if "source" in data:
        source = data["source"].strip()
        if not source:
            raise HTTPException(status_code=400, detail="Sumber referensi wajib diisi")
        data["source"] = source
    if "description" in data:
        data["description"] = data["description"].strip() if data["description"] else None

    return service.update(record, MstCeisaReferenceOriginGoodsUpdate(**data))


@router.delete(
    "/reference-codes/referensi-asal-barang/{record_id}",
    summary="Delete Referensi Asal Barang CEISA",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_reference_origin_goods(
    record_id: int,
    service: CeisaReferenceOriginGoodsService = Depends(get_ceisa_reference_origin_goods_service_w),
):
    """Hapus master referensi asal barang."""
    record = service.get_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Referensi asal barang tidak ditemukan")
    service.delete(record)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/reference-codes/referensi-asal-barang/sync",
    summary="Sinkronisasi Referensi Asal Barang dari CEISA",
    response_model=CeisaReferenceOriginGoodsSyncResult,
)
def sync_reference_origin_goods(
    service: CeisaReferenceOriginGoodsService = Depends(get_ceisa_reference_origin_goods_service_w),
):
    """Sinkronisasi master data referensi asal barang dari API CEISA."""
    return service.sync_from_ceisa()

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.BaseDB1.build_up_check_detail import BuildUpCheckDetail
from app.models.BaseDB1.build_up_check_header import BuildUpCheckHeader
from app.models.BaseDB1.build_up_check_rincian import BuildUpCheckRincian
from app.schemas.build_up_check_schema import (
    BuildUpCheckDetailCreate,
    BuildUpCheckHeaderCreate,
    BuildUpCheckRincianCreate,
)
from app.schemas.datatables_schema import DataTablesParams


class BuildUpCheckRepository:
    """Database access for mobile Build Up Check flow."""

    def __init__(self, db: Session):
        self.db = db

    def list_headers(self, flight_date: str | None = None) -> list[BuildUpCheckHeader]:
        """Return Build Up check headers ordered newest first."""
        query = self.db.query(BuildUpCheckHeader)
        if flight_date:
            query = query.filter(BuildUpCheckHeader.flight_date == flight_date)
        return query.order_by(BuildUpCheckHeader.id.desc()).all()

    def get_header_by_id(self, header_id: int) -> BuildUpCheckHeader | None:
        """Return one Build Up check header by id."""
        return (
            self.db.query(BuildUpCheckHeader)
            .filter(BuildUpCheckHeader.id == header_id)
            .first()
        )

    def create_header(self, payload: BuildUpCheckHeaderCreate) -> BuildUpCheckHeader:
        """Create a Build Up check header."""
        header = BuildUpCheckHeader(**payload.model_dump())
        self.db.add(header)
        try:
            self.db.commit()
            self.db.refresh(header)
        except Exception:
            self.db.rollback()
            raise
        return header

    def list_details(self, header_id: int) -> list[BuildUpCheckDetail]:
        """Return details for a Build Up check header."""
        return (
            self.db.query(BuildUpCheckDetail)
            .filter(BuildUpCheckDetail.header_id == header_id)
            .order_by(BuildUpCheckDetail.id.asc())
            .all()
        )

    def get_master_awb_summary(self) -> dict[str, int]:
        """Return all-time completed and unfinished Master AWB counts."""
        completed_condition = (
            (BuildUpCheckDetail.status == 1)
            | (BuildUpCheckDetail.is_allocation_final.is_(True))
        )
        row = (
            self.db.query(
                func.coalesce(
                    func.sum(case((completed_condition, 1), else_=0)),
                    0,
                ).label("completed"),
                func.coalesce(
                    func.sum(case((completed_condition, 0), else_=1)),
                    0,
                ).label("unfinished"),
            )
            .select_from(BuildUpCheckDetail)
            .one()
        )

        return {
            "unfinished": int(row.unfinished or 0),
            "completed": int(row.completed or 0),
        }

    def get_detail_by_id(self, detail_id: int) -> BuildUpCheckDetail | None:
        """Return one Build Up check detail."""
        return (
            self.db.query(BuildUpCheckDetail)
            .filter(BuildUpCheckDetail.id == detail_id)
            .first()
        )

    def create_detail(
        self,
        header_id: int,
        payload: BuildUpCheckDetailCreate,
    ) -> BuildUpCheckDetail:
        """Create a MAWB detail for a Build Up check header."""
        detail = BuildUpCheckDetail(header_id=header_id, **payload.model_dump())
        self.db.add(detail)
        try:
            self.db.commit()
            self.db.refresh(detail)
        except Exception:
            self.db.rollback()
            raise
        return detail

    def list_details_by_mawb_flight(
        self,
        mawb: str,
        flight_no: str | None,
        flight_date: object,
    ) -> list[BuildUpCheckDetail]:
        """Return same-MAWB details across ULDs for one flight identity."""
        if not mawb or not flight_no or not flight_date:
            return []

        return (
            self.db.query(BuildUpCheckDetail)
            .join(BuildUpCheckHeader, BuildUpCheckDetail.header_id == BuildUpCheckHeader.id)
            .filter(
                BuildUpCheckDetail.mawb == mawb,
                BuildUpCheckHeader.flight_no == flight_no,
                BuildUpCheckHeader.flight_date == flight_date,
            )
            .order_by(BuildUpCheckHeader.uld.asc(), BuildUpCheckDetail.id.asc())
            .all()
        )

    def update_split_metadata(
        self,
        details: list[BuildUpCheckDetail],
        group_key: str | None,
    ) -> list[BuildUpCheckDetail]:
        """Update split ULD metadata for same-MAWB detail rows."""
        if not details:
            return []

        header_ids: list[int] = []
        for detail in details:
            header_id = int(detail.header_id)
            if header_id not in header_ids:
                header_ids.append(header_id)
        sequence_by_header_id = {
            header_id: sequence for sequence, header_id in enumerate(header_ids, start=1)
        }
        split_total_uld = len(header_ids)
        is_split_uld = split_total_uld > 1

        for detail in details:
            detail.split_group_key = group_key if is_split_uld else None
            detail.split_sequence = sequence_by_header_id.get(int(detail.header_id))
            detail.split_total_uld = split_total_uld
            detail.is_split_uld = is_split_uld

        try:
            self.db.commit()
            for detail in details:
                self.db.refresh(detail)
        except Exception:
            self.db.rollback()
            raise
        return details

    def sum_rincian_by_mawb_flight(
        self,
        mawb: str,
        flight_no: str | None,
        flight_date: object,
    ) -> int:
        """Return total actual pieces for one MAWB across ULDs in one flight."""
        if not mawb or not flight_no or not flight_date:
            return 0

        total = (
            self.db.query(func.coalesce(func.sum(BuildUpCheckRincian.pieces), 0))
            .join(
                BuildUpCheckDetail,
                BuildUpCheckRincian.check_detail_id == BuildUpCheckDetail.id,
            )
            .join(BuildUpCheckHeader, BuildUpCheckDetail.header_id == BuildUpCheckHeader.id)
            .filter(
                BuildUpCheckDetail.mawb == mawb,
                BuildUpCheckHeader.flight_no == flight_no,
                BuildUpCheckHeader.flight_date == flight_date,
            )
            .scalar()
        )
        return int(total or 0)

    def create_rincian(
        self,
        detail_id: int,
        payload: BuildUpCheckRincianCreate,
    ) -> BuildUpCheckRincian:
        """Create rincian pieces for a Build Up check detail."""
        rincian = BuildUpCheckRincian(check_detail_id=detail_id, **payload.model_dump())
        self.db.add(rincian)
        try:
            self.db.commit()
            self.db.refresh(rincian)
        except Exception:
            self.db.rollback()
            raise
        return rincian

    def close_detail_allocation(
        self,
        detail: BuildUpCheckDetail,
        total_pieces: int,
        status: int,
    ) -> BuildUpCheckDetail:
        """Close one ULD allocation for a MAWB detail."""
        detail.total_pieces = total_pieces
        detail.status = status
        detail.is_allocation_final = True
        detail.allocation_closed_at = func.now()
        try:
            self.db.commit()
            self.db.refresh(detail)
        except Exception:
            self.db.rollback()
            raise
        return detail

    def update_detail_status(
        self,
        detail: BuildUpCheckDetail,
        status: int,
    ) -> BuildUpCheckDetail:
        """Update Build Up check detail completion status."""
        detail.status = status
        try:
            self.db.commit()
            self.db.refresh(detail)
        except Exception:
            self.db.rollback()
            raise
        return detail

    def datatable(  # noqa: PLR0912
        self,
        params: DataTablesParams,
    ) -> tuple[int, int, list[BuildUpCheckHeader]]:
        """Return total count, filtered count, and list of BuildUpCheckHeader for Datatables.
        
        Args:
            params: Parameters containing draw, start, length, order, search, and filters.
            
        Returns:
            A tuple of (total_records, filtered_records, list_of_headers).
        """
        # 1. Total records (tanpa filter)
        total_records = self.db.query(func.count(BuildUpCheckHeader.id)).scalar() or 0

        # 2. Base query
        query = self.db.query(BuildUpCheckHeader)

        # Jika ada filter mawb, kita join ke BuildUpCheckDetail
        filters = params.filters
        mawb_filter = getattr(filters, "mawb", None) if filters else None
        has_detail_join = False

        if mawb_filter:
            mawb_str = str(mawb_filter).strip().upper()
            if mawb_str:
                query = query.join(BuildUpCheckHeader.details)
                query = query.filter(BuildUpCheckDetail.mawb.like(f"%{mawb_str}%"))
                has_detail_join = True

        # Tambahkan filter lain pada BuildUpCheckHeader
        if filters:
            uld_val = getattr(filters, "uld", None)
            if uld_val:
                query = query.filter(BuildUpCheckHeader.uld.like(f"%{str(uld_val).strip().upper()}%"))
            
            airlines_val = getattr(filters, "airlines", None)
            if airlines_val:
                query = query.filter(BuildUpCheckHeader.airlines.like(f"%{str(airlines_val).strip().upper()}%"))
            
            flight_no_val = getattr(filters, "flight_no", None)
            if flight_no_val:
                query = query.filter(BuildUpCheckHeader.flight_no.like(f"%{str(flight_no_val).strip().upper()}%"))

            flight_date_val = getattr(filters, "flight_date", None)
            if flight_date_val:
                # filter tanggal bisa exact match karena tipenya Date
                query = query.filter(BuildUpCheckHeader.flight_date == flight_date_val)

            dest_val = getattr(filters, "dest", None)
            if dest_val:
                query = query.filter(BuildUpCheckHeader.dest.like(f"%{str(dest_val).strip().upper()}%"))

        # Jika join detail terjadi, gunakan distinct untuk menghindari duplikasi header
        if has_detail_join:
            query = query.distinct()

        # 3. Filtered records count
        if has_detail_join:
            filtered_records = self.db.query(func.count(func.distinct(BuildUpCheckHeader.id))).select_from(query.subquery()).scalar() or 0
        else:
            filtered_records = query.count()

        # 4. Sorting
        for order in params.order:
            col_idx = order.column
            col_name = params.columns[col_idx].data
            direction = order.dir

            if hasattr(BuildUpCheckHeader, col_name):
                col = getattr(BuildUpCheckHeader, col_name)
                if direction == "desc":
                    query = query.order_by(col.desc())
                else:
                    query = query.order_by(col.asc())
            else:
                query = query.order_by(BuildUpCheckHeader.id.desc())
        
        if not params.order:
            query = query.order_by(BuildUpCheckHeader.id.desc())

        # 5. Pagination
        results = query.offset(params.start).limit(params.length).all()

        return total_records, filtered_records, results

    def delete_header(self, header: BuildUpCheckHeader) -> None:
        """Hapus header build up check beserta detail dan rinciannya secara permanen.

        Args:
            header: Object BuildUpCheckHeader yang akan dihapus.

        Returns:
            None
        """
        self.db.delete(header)
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            raise



from typing import TypeVar

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import InstrumentedAttribute

from app.schemas.datatables_schema import CustomFilters, DataTablesParams, DataTablesResponse

# Tipe generik untuk model SQLAlchemy
ModelType = TypeVar("ModelType")
# Tipe generik untuk Pydantic schema
SchemaType = TypeVar("SchemaType")

class DataTablesService:
    """
    Class generik untuk menangani query DataTables.
    """
    def __init__(self, model: type[ModelType], schema: type[SchemaType], search_columns: list[str] | None = None, custom_filters: list[str] | None = None):
        self.model = model
        self.schema = schema
        self.search_columns = search_columns if search_columns is not None else []
        self.custom_filters = custom_filters if custom_filters is not None else []

    def get_datatable(self, db: Session, params: DataTablesParams) -> DataTablesResponse[SchemaType]:
        params = self.apply_custom_filters(params)
        """
        Menjalankan query datatables dengan filter, sorting, dan pagination.
        """
        query = db.query(self.model)
        
        # Total records (sebelum filtering)
        # ini berarti di tiap model harus ada id
        total_records = db.query(func.count(self.model.id)).scalar()

        # --- Logika Filter Kustom yang Dinamis ---
        custom_filter_conditions = []
        if params.filters:
            # ambil langsung filter dict
            filters = params.filters
            # 🎯 handle range tanggal dulu
            tanggal_awal = getattr(filters, "TANGGAL_AWAL", None)
            tanggal_akhir = getattr(filters, "TANGGAL_AKHIR", None)
            if tanggal_awal and tanggal_akhir:
                # range: >= TANGGAL_AWAL & <= TANGGAL_AKHIR
                custom_filter_conditions.append(and_(self.model.TANGGAL >= tanggal_awal, self.model.TANGGAL <= tanggal_akhir))
            elif tanggal_awal:
                # hanya dari tanggal_awal ke atas
                custom_filter_conditions.append(self.model.TANGGAL >= tanggal_awal)
            elif tanggal_akhir:
                # hanya sampai tanggal_akhir
                custom_filter_conditions.append(self.model.TANGGAL <= tanggal_akhir)
            
            # 🎯 filter lain
            for filter_name in self.custom_filters:
                if filter_name in ["TANGGAL_AWAL", "TANGGAL_AKHIR"]:
                    continue
                filter_value = getattr(filters, filter_name, None)
                if not filter_value:
                    continue
                model_column = getattr(self.model, filter_name, None)
                if model_column is None:
                    continue
                
                if filter_name.upper() == "TANGGAL":
                    # filter exact match tanggal
                    # custom_filter_conditions.append(model_column == filter_value)
                    # tanggal pake like juga kalo ada jamnya
                    custom_filter_conditions.append(model_column.like(f"%{filter_value}%"))
                    
                else:
                    # filter LIKE untuk string
                    custom_filter_conditions.append(model_column.like(f"%{filter_value}%"))
            
            
        
        # print(custom_filter_conditions)
        # Filtering/Searching (Global search)
        global_search_conditions = []
        if params.search.value and self.search_columns:
            search_value = f"%{params.search.value}%"
            global_search_conditions = [
                getattr(self.model, col_name).like(search_value)
                for col_name in self.search_columns
                if hasattr(self.model, col_name)
            ]
        
        # Gabungkan semua filter (kustom dan global)
        combined_filters = []
        if custom_filter_conditions:
            combined_filters.append(and_(*custom_filter_conditions))
        if global_search_conditions:
            combined_filters.append(or_(*global_search_conditions))

        if combined_filters:
            query = query.filter(and_(*combined_filters))

        # Filtered records
        filtered_records = query.count()

        # Ordering/Sorting
        for order in params.order:
            col_idx = order.column
            col_name = params.columns[col_idx].data
            direction = order.dir

            if hasattr(self.model, col_name):
                col: InstrumentedAttribute = getattr(self.model, col_name)
                if direction == "desc":
                    query = query.order_by(col.desc())
                else:
                    query = query.order_by(col.asc())

        # Pagination
        results = query.offset(params.start).limit(params.length).all()
        
        # Buat response DataTables
        dt_response = DataTablesResponse(
            draw=params.draw,
            recordsTotal=total_records,
            recordsFiltered=filtered_records,
            data=[self.schema.model_validate(r) for r in results]
        )
        return dt_response
    
    def apply_custom_filters(self, params: DataTablesParams) -> DataTablesParams:
            """
            Inject custom filter fields ke dalam params.filters jika belum ada.
            """
            if not params.filters:
                params.filters = CustomFilters()

            for field in self.custom_filters:
                if not hasattr(params.filters, field):
                    setattr(params.filters, field, None)

            return params


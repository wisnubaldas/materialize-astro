from typing import Type, List, Optional, TypeVar
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import InstrumentedAttribute
from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse

# Tipe generik untuk model SQLAlchemy
ModelType = TypeVar("ModelType")
# Tipe generik untuk Pydantic schema
SchemaType = TypeVar("SchemaType")

class DataTablesService:
    """
    Class generik untuk menangani query DataTables.
    """
    def __init__(self, model: Type[ModelType], schema: Type[SchemaType], search_columns: Optional[List[str]] = None, custom_filters: Optional[List[str]] = None):
        self.model = model
        self.schema = schema
        self.search_columns = search_columns if search_columns is not None else []
        self.custom_filters = custom_filters if custom_filters is not None else []

    def get_datatable(self, db: Session, params: DataTablesParams) -> DataTablesResponse[SchemaType]:
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
            for filter_name in self.custom_filters:
                filter_value = getattr(params.filters, filter_name, None)
                if filter_value:
                    # Asumsi kolom di model memiliki nama yang sama dengan nama filter
                    model_column = getattr(self.model, filter_name, None)
                    if model_column:
                        # Kasus khusus untuk filter tanggal
                        if "TANGGAL" in filter_name.upper() or "DATE" in filter_name.upper():
                            # Asumsi tanggal dikirim sebagai 'yyyy-mm-dd'
                            # Ini bisa diubah untuk menangani rentang tanggal
                            custom_filter_conditions.append(model_column == filter_value)
                        # Filter teks biasa
                        else:
                            custom_filter_conditions.append(model_column.like(f"%{filter_value}%"))
        
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

# from typing import Type, List, Optional, TypeVar
# from sqlalchemy import func, or_
# from sqlalchemy.orm import Session
# from sqlalchemy.orm.attributes import InstrumentedAttribute
# from app.schemas.datatables_schema import DataTablesParams, DataTablesResponse

# # Tipe generik untuk model SQLAlchemy
# ModelType = TypeVar("ModelType")
# # Tipe generik untuk Pydantic schema
# SchemaType = TypeVar("SchemaType")

# class DataTablesService:
#     """
#     Class generik untuk menangani query DataTables.
#     """
#     def __init__(self, model: Type[ModelType], schema: Type[SchemaType], search_columns: Optional[List[str]] = None):
#         self.model = model
#         self.schema = schema
#         self.search_columns = search_columns if search_columns is not None else []

#     def get_datatable(self, db: Session, params: DataTablesParams) -> DataTablesResponse[SchemaType]:
#         """
#         Menjalankan query datatables dengan filter, sorting, dan pagination.
#         """
#         query = db.query(self.model)
        
#         # Total records (sebelum filtering)
#         # ini berarti di tiap model harus ada id
#         total_records = db.query(func.count(self.model.id)).scalar()

#         # Filtering/Searching
#         if params.search.value and self.search_columns:
#             search_value = f"%{params.search.value}%"
#             # Buat list of filter conditions menggunakan OR
#             conditions = [
#                 getattr(self.model, col_name).like(search_value)
#                 for col_name in self.search_columns
#                 if hasattr(self.model, col_name)
#             ]
#             if conditions:
#                 query = query.filter(or_(*conditions))
        
#         # Filtered records
#         filtered_records = query.count()

#         # Ordering/Sorting
#         for order in params.order:
#             col_idx = order.column
#             col_name = params.columns[col_idx].data
#             direction = order.dir

#             if hasattr(self.model, col_name):
#                 # Dapatkan atribut kolom dari model
#                 col: InstrumentedAttribute = getattr(self.model, col_name)
#                 if direction == "desc":
#                     query = query.order_by(col.desc())
#                 else:
#                     query = query.order_by(col.asc())

#         # Pagination
#         results = query.offset(params.start).limit(params.length).all()
        
#         # Buat response DataTables
#         dt_response = DataTablesResponse(
#             draw=params.draw,
#             recordsTotal=total_records,
#             recordsFiltered=filtered_records,
#             data=[self.schema.model_validate(r) for r in results]
#         )
#         return dt_response
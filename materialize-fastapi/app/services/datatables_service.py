from typing import Type, List, Optional, TypeVar
from sqlalchemy import func, or_
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
    def __init__(self, model: Type[ModelType], schema: Type[SchemaType], search_columns: Optional[List[str]] = None):
        self.model = model
        self.schema = schema
        self.search_columns = search_columns if search_columns is not None else []

    def get_datatable(self, db: Session, params: DataTablesParams) -> DataTablesResponse[SchemaType]:
        """
        Menjalankan query datatables dengan filter, sorting, dan pagination.
        """
        query = db.query(self.model)
        
        # Total records (sebelum filtering)
        # ini berarti di tiap model harus ada id
        total_records = db.query(func.count(self.model.id)).scalar()

        # Filtering/Searching
        if params.search.value and self.search_columns:
            search_value = f"%{params.search.value}%"
            # Buat list of filter conditions menggunakan OR
            conditions = [
                getattr(self.model, col_name).like(search_value)
                for col_name in self.search_columns
                if hasattr(self.model, col_name)
            ]
            if conditions:
                query = query.filter(or_(*conditions))
        
        # Filtered records
        filtered_records = query.count()

        # Ordering/Sorting
        for order in params.order:
            col_idx = order.column
            col_name = params.columns[col_idx].data
            direction = order.dir

            if hasattr(self.model, col_name):
                # Dapatkan atribut kolom dari model
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
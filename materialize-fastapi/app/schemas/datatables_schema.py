from typing import List, Optional, Generic, TypeVar
from pydantic import BaseModel, Field
from pydantic.generics import GenericModel

T = TypeVar("T")

# Input: Permintaan dari DataTables
# Model untuk filter kustom Anda
class CustomFilters(BaseModel):
    NO_INVOICE: Optional[str] = None
    TANGGAL: Optional[str] = None
    # Tambahkan bidang filter lain sesuai kebutuhan
    Email: Optional[str] = None
    Post: Optional[str] = None
    City: Optional[str] = None
    Salary: Optional[str] = None


class ColumnSearch(BaseModel):
    value: Optional[str] = ""
    regex: Optional[bool] = False


class ColumnOrder(BaseModel):
    column: int
    dir: str
    name: Optional[str] = None


class Column(BaseModel):
    data: Optional[str] = ""
    name: Optional[str] = ""
    searchable: Optional[bool] = True
    orderable: Optional[bool] = True
    search: ColumnSearch


class GlobalSearch(BaseModel):
    value: Optional[str] = ""
    regex: Optional[bool] = False


class DataTablesParams(BaseModel):
    draw: int
    start: int
    length: int
    search: GlobalSearch
    order: List[ColumnOrder]
    columns: List[Column]
    # Bidang baru untuk filter kustom
    filters: Optional[CustomFilters] = Field(default_factory=CustomFilters)


# Output: Response DataTables
class DataTablesResponse(GenericModel, Generic[T]):
    draw: int
    recordsTotal: int
    recordsFiltered: int
    data: List[T]


# from typing import List, Optional, Generic, TypeVar
# from pydantic import BaseModel, Field
# # from pydantic.generics import GenericModel

# T = TypeVar("T")

# # Input: Permintaan dari DataTables
# class ColumnSearch(BaseModel):
#     value: Optional[str] = ""
#     regex: Optional[bool] = False


# class ColumnOrder(BaseModel):
#     column: int
#     dir: str
#     name: Optional[str] = None


# class Column(BaseModel):
#     data: Optional[str] = ""
#     name: Optional[str] = ""
#     searchable: Optional[bool] = True
#     orderable: Optional[bool] = True
#     search: ColumnSearch


# class GlobalSearch(BaseModel):
#     value: Optional[str] = ""
#     regex: Optional[bool] = False


# class DataTablesParams(BaseModel):
#     draw: int
#     start: int
#     length: int
#     search: GlobalSearch
#     order: List[ColumnOrder]
#     columns: List[Column]

# # Output: Response DataTables
# class DataTablesResponse(BaseModel, Generic[T]):
#     draw: int
#     recordsTotal: int
#     recordsFiltered: int
#     data: List[T]

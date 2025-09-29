from typing import Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")

# Input: Permintaan dari DataTables
# Model untuk filter kustom Anda
class CustomFilters(BaseModel):
    id: str | None = None
    
    class Config:
            extra = 'allow'

    # Tambahkan bidang filter lain sesuai kebutuhan


class ColumnSearch(BaseModel):
    value: str | None = ""
    regex: bool | None = False


class ColumnOrder(BaseModel):
    column: int
    dir: str
    name: str | None = None


class Column(BaseModel):
    data: str | None = ""
    name: str | None = ""
    searchable: bool | None = True
    orderable: bool | None = True
    search: ColumnSearch


class GlobalSearch(BaseModel):
    value: str | None = ""
    regex: bool | None = False


class DataTablesParams(BaseModel):
    draw: int
    start: int
    length: int
    search: GlobalSearch
    order: list[ColumnOrder]
    columns: list[Column]
    # Bidang baru untuk filter kustom
    filters: CustomFilters | None = Field(default_factory=CustomFilters)


# Output: Response DataTables
class DataTablesResponse(BaseModel, Generic[T]):
    draw: int
    recordsTotal: int
    recordsFiltered: int
    data: list[T]


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

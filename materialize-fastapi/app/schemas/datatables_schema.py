from typing import Generic, TypeVar

from pydantic import BaseModel, Field, field_validator

T = TypeVar("T")


# Input: Permintaan dari DataTables
# Model untuk filter kustom Anda
class CustomFilters(BaseModel):
    id: str | None = None

    class Config:
        extra = "allow"

    # Tambahkan bidang filter lain sesuai kebutuhan


class ColumnSearch(BaseModel):
    value: str = ""
    regex: bool | None = False

    @field_validator("value", mode="before")
    @classmethod
    def normalize_value(cls, value):
        if value is None:
            return ""
        if isinstance(value, str):
            return value
        if isinstance(value, (int, float, bool)):
            return str(value)
        return ""


class ColumnOrder(BaseModel):
    column: int
    dir: str
    name: str | None = None

    @field_validator("dir", mode="before")
    @classmethod
    def normalize_dir(cls, value):
        if value is None:
            return "asc"
        if isinstance(value, str):
            return value
        return str(value)


class Column(BaseModel):
    data: str = ""
    name: str = ""
    searchable: bool | None = True
    orderable: bool | None = True
    search: ColumnSearch

    @field_validator("data", "name", mode="before")
    @classmethod
    def normalize_text_fields(cls, value):
        if value is None:
            return ""
        if isinstance(value, str):
            return value
        if isinstance(value, (int, float, bool)):
            return str(value)
        return ""


class GlobalSearch(BaseModel):
    value: str = ""
    regex: bool | None = False

    @field_validator("value", mode="before")
    @classmethod
    def normalize_value(cls, value):
        if value is None:
            return ""
        if isinstance(value, str):
            return value
        if isinstance(value, (int, float, bool)):
            return str(value)
        return ""


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

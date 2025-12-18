from typing import Generic, TypeVar  # noqa: N999

from pydantic import BaseModel

T = TypeVar("T")


class ResponseSchema(BaseModel, Generic[T]):
    status: int
    message: str
    data: T | None = None

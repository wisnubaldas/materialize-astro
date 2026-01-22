from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=255)


class UserUpdate(BaseModel):
    username: str | None = Field(None, min_length=1, max_length=50)
    email: EmailStr | None = None


class UserPasswordUpdate(BaseModel):
    new_password: str = Field(..., min_length=6, max_length=255)
    current_password: str | None = Field(default=None, max_length=255)


class UserOut(UserBase):
    id: int

    model_config = {"from_attributes": True}


class RoleBase(BaseModel):
    role_name: str = Field(..., min_length=2, max_length=100)


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    role_name: str | None = Field(None, min_length=2, max_length=100)


class RoleOut(RoleBase):
    id: int
    active: bool | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserRolesUpdate(BaseModel):
    role_ids: list[int] = Field(default_factory=list)


class MenuBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    url: str = Field(..., min_length=1)
    icon: str = Field(default="", max_length=100)
    parent: int = Field(default=0, ge=0)
    role_id: int | None = None


class MenuCreate(MenuBase):
    pass


class MenuUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    url: str | None = Field(None, min_length=1)
    icon: str | None = Field(None, max_length=100)
    parent: int | None = Field(default=None, ge=0)
    role_id: int | None = None


class MenuOut(MenuBase):
    id: int
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class MenuTreeOut(MenuOut):
    subItems: list["MenuTreeOut"] = Field(default_factory=list)

    model_config = {"from_attributes": True}

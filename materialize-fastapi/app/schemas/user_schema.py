from pydantic import BaseModel, EmailStr, Field


class LoginSchema(BaseModel):
    email: str = Field('admin@admin.com')
    password: str = Field('password123')


class TokenSchema(BaseModel):
    access_token: str
    token_type: str


class UserProfileSchema(BaseModel):
    id: int
    username: str
    email: EmailStr
    roles: list[str] = Field(default_factory=list)

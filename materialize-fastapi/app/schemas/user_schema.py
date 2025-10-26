from pydantic import BaseModel, Field


class LoginSchema(BaseModel):
    email: str = Field('admin@admin.com')
    password: str = Field('password123')


class TokenSchema(BaseModel):
    access_token: str
    token_type: str

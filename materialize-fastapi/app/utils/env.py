from pydantic_settings import BaseSettings
class ENV(BaseSettings):
    DB1_HOST_R:str
    DB1_HOST_W:str
    DB1_PORT:int
    DB1_USER:str
    DB1_PASSWORD:str | None
    DB1_NAME:str

    DB2_HOST_R:str
    DB2_HOST_W:str
    DB2_PORT:int
    DB2_USER:str
    DB2_PASSWORD:str | None
    DB2_NAME:str

    DB3_HOST_R:str
    DB3_HOST_W:str
    DB3_PORT:int
    DB3_USER:str
    DB3_PASSWORD:str | None
    DB3_NAME:str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"   # otomatis baca file .env
        env_file_encoding = "utf-8"

ENV = ENV()
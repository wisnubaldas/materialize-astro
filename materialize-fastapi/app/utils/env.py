from pydantic_settings import BaseSettings


class ENV(BaseSettings):
    APP_ENV: str
    APP_DEBUG: bool = False
    APP_URL: str
    APP_PORT: int
    APP_NAME: str
    DB1_HOST_R: str
    DB1_HOST_W: str
    DB1_PORT: int
    DB1_USER: str
    DB1_PASSWORD: str | None
    DB1_NAME: str

    DB2_HOST_R: str
    DB2_HOST_W: str
    DB2_PORT: int
    DB2_USER: str
    DB2_PASSWORD: str | None
    DB2_NAME: str

    DB3_HOST_R: str
    DB3_HOST_W: str
    DB3_PORT: int
    DB3_USER: str
    DB3_PASSWORD: str | None
    DB3_NAME: str

    DB4_HOST_R: str
    DB4_HOST_W: str
    DB4_PORT: int
    DB4_USER: str
    DB4_PASSWORD: str | None
    DB4_NAME: str

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    AP2_URL: str
    AP2_USER: str
    AP2_PASSWORD: str
    AP2_COOKIE: str
    AP2_TIMEOUT: int

    AP2_DEV_URL: str
    AP2_DEV_USER: str
    AP2_DEV_PASSWORD: str
    AP2_DEV_COOKIE: str | None = None
    AP2_VOID_TIMEOUT: int = 15

    HUBNET_URL: str
    HUBNET_URL_DEV: str
    HUBNET_USER: str
    HUBNET_PASSWORD: str
    HUBNET_BATCH_LIMIT: int = 10

    CEISA_BASE_URL: str | None = None
    CEISA_AUTH_URL: str | None = None
    CEISA_CLIENT_ID: str | None = None
    CEISA_CLIENT_SECRET: str | None = None
    CEISA_API_KEY: str | None = None
    CEISA_TIMEOUT: int = 30

    REDIS_URL: str = "redis://localhost:6379/5"
    SSE_KEY: str = None
    CORS_ALLOW_ORIGINS: str | None = None
    AUTH_COOKIE_DOMAIN: str | None = None
    AUTH_COOKIE_SAMESITE: str | None = None
    AUTH_COOKIE_SECURE: bool | None = None

    LOG_SERVICE_NAME: str | None = None
    LOG_SERVICE_VERSION: int | None = None
    REQUEST_LOG_SLOW_MS: int = 500
    REQUEST_LOG_ALL: bool = False

    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int = 587
    MAIL_SERVER: str
    MAIL_TLS: bool = True
    MAIL_SSL: bool = False
    MAIL_FROM_NAME: str

    ELMAIL_USER: str
    ELMAIL_PASSWORD: str
    ELMAIL_SERVER: str
    ELMAIL_PORT: int

    class Config:
        env_file = ".env"  # otomatis baca file .env
        env_file_encoding = "utf-8"


ENV = ENV()  # type: ignore

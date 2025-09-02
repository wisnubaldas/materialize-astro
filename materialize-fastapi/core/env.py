import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class ENV:
    TITLE: str = os.getenv("TITLE", "Default App Title")
    ENV: str = os.getenv("ENV", "development")
    VERSION: str = os.getenv("VERSION", "0.01")
    DESC: str = os.getenv("DESC", "Aplikasi Backend untuk apa? untuk apa saja")
    ## koneksi ke segala database
    MYSQL: str = os.getenv("MYSQL1_URL", "mysql+asyncmy://user:pass@localhost:3306/db1")
    MYSQL2: str = os.getenv(
        "MYSQL2_URL", "mysql+asyncmy://user:pass@localhost:3306/db2"
    )
    MYSQL3: str = os.getenv(
        "MYSQL3_URL", "mysql+asyncmy://user:pass@localhost:3306/db2"
    )
    MONGODB: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    REDIS: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    # auth
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "wisnubaldas")
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRE_MINUTES = 60  # token expire in 1 hour
    SIGO_PATH = os.getenv("SIGO_PATH", "https://lane.angkasapura2.co.id/")
    SIGO_CLIENT_USER = os.getenv("SIGO_CLIENT_USER", "root")
    SIGO_CLIENT_PASSWORD = os.getenv("SIGO_CLIENT_PASSWORD", "password")
    SIGO_COOKIES = os.getenv(
        "SIGO_COOKIES", "dtCookie=CD78B9A24184B932B72CB79ED316B71D|X2RlZmF1bHR8MQ"
    )
    SIGO_TIMEOUT = int(os.getenv("SIGO_TIMEOUT", "5"))
    SENTRY_DSN = os.getenv("SENTRY_DSN", "https://")
    REQUEST_TIMEOUT = int(
        os.getenv("REQUEST_TIMEOUT", "30")
    )  # timeout for requests in seconds

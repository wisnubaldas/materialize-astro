from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.utils.env import ENV


def make_url(user, pwd, host, port, db):
    """Build a SQLAlchemy connection URL.

    When the database password is optional the previous implementation would
    literally embed ``None`` into the string (``mysql+pymysql://user:None@...``)
    which breaks connections for database users without a password. Interpo-
    lating values also failed to quote special characters in credentials.

    ``URL.create`` handles both cases by omitting the password portion when it
    is ``None`` and by escaping credentials when necessary.
    """

    return URL.create(
        drivername="mysql+pymysql",
        username=user,
        password=pwd or None,
        host=host,
        port=port,
        database=db,
    )


# DB1
engine_db1_w = create_engine(
    make_url(ENV.DB1_USER, ENV.DB1_PASSWORD, ENV.DB1_HOST_W, ENV.DB1_PORT, ENV.DB1_NAME),
    pool_pre_ping=True,
)
engine_db1_r = create_engine(
    make_url(ENV.DB1_USER, ENV.DB1_PASSWORD, ENV.DB1_HOST_R, ENV.DB1_PORT, ENV.DB1_NAME),
    pool_pre_ping=True,
)
SessionDB1W = sessionmaker(bind=engine_db1_w, autoflush=False, autocommit=False)
SessionDB1R = sessionmaker(bind=engine_db1_r, autoflush=False, autocommit=False)
BaseDB1 = declarative_base()

# DB2
engine_db2_w = create_engine(
    make_url(ENV.DB2_USER, ENV.DB2_PASSWORD, ENV.DB2_HOST_W, ENV.DB2_PORT, ENV.DB2_NAME),
    pool_pre_ping=True,
)
engine_db2_r = create_engine(
    make_url(ENV.DB2_USER, ENV.DB2_PASSWORD, ENV.DB2_HOST_R, ENV.DB2_PORT, ENV.DB2_NAME),
    pool_pre_ping=True,
)
SessionDB2W = sessionmaker(bind=engine_db2_w, autoflush=False, autocommit=False)
SessionDB2R = sessionmaker(bind=engine_db2_r, autoflush=False, autocommit=False)
BaseDB2 = declarative_base()

# DB3
engine_db3_w = create_engine(
    make_url(ENV.DB3_USER, ENV.DB3_PASSWORD, ENV.DB3_HOST_W, ENV.DB3_PORT, ENV.DB3_NAME),
    pool_pre_ping=True,
)
engine_db3_r = create_engine(
    make_url(ENV.DB3_USER, ENV.DB3_PASSWORD, ENV.DB3_HOST_R, ENV.DB3_PORT, ENV.DB3_NAME),
    pool_pre_ping=True,
)
SessionDB3W = sessionmaker(bind=engine_db3_w, autoflush=False, autocommit=False)
SessionDB3R = sessionmaker(bind=engine_db3_r, autoflush=False, autocommit=False)
BaseDB3 = declarative_base()


# Dependency
def get_db1_w() -> Generator[Session, None, None] | Session:
    db = SessionDB1W()
    try:
        yield db
    finally:
        db.close()


def get_db1_r() -> Generator[Session, None, None] | Session:
    db = SessionDB1R()
    try:
        yield db
    finally:
        db.close()


def get_db2_w() -> Generator[Session, None, None] | Session:
    db = SessionDB2W()
    try:
        yield db
    finally:
        db.close()


def get_db2_r() -> Generator[Session, None, None] | Session:
    db = SessionDB2R()
    try:
        yield db
    finally:
        db.close()


def get_db3_w() -> Generator[Session, None, None] | Session:
    db = SessionDB3W()
    try:
        yield db
    finally:
        db.close()


def get_db3_r() -> Generator[Session, None, None] | Session:
    db = SessionDB3R()
    try:
        yield db
    finally:
        db.close()

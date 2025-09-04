from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, declarative_base

DATABASE_URL = "mysql+pymysql://root:@localhost:3306/mau_app"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
def get_db() -> Session: # type: ignore
    db = SessionLocal()
    try:
        yield db # type: ignore
    finally:
        db.close()

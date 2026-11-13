import sqlalchemy
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os
import logging

from backend.config import DATABASE_URL, BASE_DIR

logger = logging.getLogger(__name__)

effective_db_url = DATABASE_URL
if effective_db_url and effective_db_url.startswith("postgresql://"):
    effective_db_url = effective_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

connect_args = {}
if "sqlite" in effective_db_url:
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        effective_db_url,
        connect_args=connect_args,
        echo=os.getenv("DEBUG", "False").lower() == "true",
    )
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.warning(f"Database connection to '{effective_db_url}' failed: {e}. Falling back to SQLite.")
    is_vercel = os.getenv("VERCEL") == "1"
    sqlite_path = "/tmp/dev.db" if is_vercel else str(BASE_DIR / 'dev.db')
    sqlite_url = f"sqlite:///{sqlite_path}"
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False},
        echo=False
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""
    pass


def init_db():
    """Initialize the database by creating all tables."""
    Base.metadata.create_all(bind=engine)
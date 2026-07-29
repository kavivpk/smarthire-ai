"""
database.py — SQLAlchemy engine and session for MySQL with automatic SQLite fallback
"""
import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost:3306/smarthire_db")

try:
    temp_engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,
        pool_recycle=3600,
        echo=False,
    )
    with temp_engine.connect() as conn:
        print("[Database] Connected to MySQL successfully!")
    engine = temp_engine
except Exception as e:
    print(f"[Database] MySQL connection unavailable ({e}). Automatically using SQLite database.")
    sqlite_url = "sqlite:///./smarthire.db"
    engine = create_engine(
        sqlite_url,
        connect_args={"check_same_thread": False},
        echo=False,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

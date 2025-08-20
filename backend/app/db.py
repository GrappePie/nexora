import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from alembic import command
from alembic.config import Config

# DATABASE_URL examples:
# - PostgreSQL: postgresql+psycopg://nexora:nexora@127.0.0.1:5432/nexora
# - SQLite (default): sqlite:///backend.db

def get_database_url() -> str:
    return os.getenv("DATABASE_URL", "sqlite:///backend.db")

DATABASE_URL = get_database_url()

# For SQLite, need check_same_thread=False for multi-thread (uvicorn)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, echo=False, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

Base = declarative_base()


def run_migrations() -> None:
    """Apply database migrations on startup."""
    if os.environ.get("DB_MIGRATIONS_RUN"):
        return
    os.environ["DB_MIGRATIONS_RUN"] = "1"
    cfg = Config(str(Path(__file__).resolve().parent.parent / "alembic.ini"))
    try:
        command.upgrade(cfg, "head")
    except Exception as e:  # pragma: no cover - best effort
        print(f"[WARN] Alembic upgrade skipped or failed: {e!r}")


run_migrations()

# FastAPI dependency
from typing import Generator

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


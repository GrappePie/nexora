import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

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

# FastAPI dependency
from typing import Generator

def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Float, DateTime
from .db import Base
from uuid import uuid4
from datetime import datetime, timezone, timedelta

class QuoteORM(Base):
    __tablename__ = "quotes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: uuid4().hex[:8])
    customer: Mapped[str] = mapped_column(String(255), nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, default=lambda: uuid4().hex)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc))
    token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc) + timedelta(days=7)
    )

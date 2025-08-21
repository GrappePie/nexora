from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import (
    String,
    Float,
    DateTime,
    Table,
    Column,
    ForeignKey,
    Integer,
    Boolean,
    Index,
)
from .db import Base
from uuid import uuid4
from datetime import datetime, timezone, timedelta


user_roles = Table(
    "user_roles",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("role_id", ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
)


class RoleORM(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    users: Mapped[list["UserORM"]] = relationship(
        "UserORM", secondary=user_roles, back_populates="roles"
    )


class UserORM(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    reset_token: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    reset_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    roles: Mapped[list[RoleORM]] = relationship(
        "RoleORM", secondary=user_roles, back_populates="users"
    )


class CustomerORM(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    rfc: Mapped[str] = mapped_column(String(64), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    __table_args__ = (Index("idx_customers_name", "name"),)

    vehicles: Mapped[list["VehicleORM"]] = relationship(
        "VehicleORM", back_populates="customer", cascade="all, delete-orphan"
    )
    quotes: Mapped[list["QuoteORM"]] = relationship(
        "QuoteORM", back_populates="customer_obj"
    )


class VehicleORM(Base):
    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("customers.id", ondelete="CASCADE"), nullable=False
    )
    plates: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    vin: Mapped[str | None] = mapped_column(String(64), nullable=True, unique=True)
    make: Mapped[str | None] = mapped_column(String(64), nullable=True)
    model: Mapped[str | None] = mapped_column(String(64), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    __table_args__ = (Index("idx_vehicles_customer", "customer_id"),)

    customer: Mapped[CustomerORM] = relationship(
        "CustomerORM", back_populates="vehicles"
    )

class QuoteORM(Base):
    __tablename__ = "quotes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: uuid4().hex[:8])
    customer: Mapped[str] = mapped_column(String(255), nullable=False)
    customer_id: Mapped[int | None] = mapped_column(
        ForeignKey("customers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    total: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    token: Mapped[str] = mapped_column(String(64), nullable=False, default=lambda: uuid4().hex)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc))
    token_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc) + timedelta(days=7)
    )
    __table_args__ = (
        Index("idx_quotes_customer", "customer_id"),
        Index("ux_quotes_approval_token", "token", unique=True),
    )

    customer_obj: Mapped[CustomerORM | None] = relationship(
        "CustomerORM", back_populates="quotes"
    )
    items: Mapped[list["QuoteItemORM"]] = relationship(
        "QuoteItemORM", back_populates="quote", cascade="all, delete-orphan"
    )
    work_order: Mapped["WorkOrderORM | None"] = relationship(
        "WorkOrderORM", back_populates="quote", uselist=False
    )


class StockORM(Base):
    __tablename__ = "stock"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    item: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    __table_args__ = (Index("idx_stock_item", "item"),)


class QuoteItemORM(Base):
    __tablename__ = "quote_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    quote_id: Mapped[str] = mapped_column(
        ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    qty: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    is_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    quote: Mapped[QuoteORM] = relationship(
        "QuoteORM", back_populates="items"
    )


class WorkOrderORM(Base):
    __tablename__ = "work_orders"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: uuid4().hex[:8])
    quote_id: Mapped[str | None] = mapped_column(
        ForeignKey("quotes.id", ondelete="SET NULL"), unique=True
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc)
    )

    quote: Mapped[QuoteORM | None] = relationship(
        "QuoteORM", back_populates="work_order"
    )
    attachments: Mapped[list["AttachmentORM"]] = relationship(
        "AttachmentORM", back_populates="work_order", cascade="all, delete-orphan"
    )


class AttachmentORM(Base):
    __tablename__ = "attachments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    work_order_id: Mapped[str] = mapped_column(
        ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False
    )
    s3_key: Mapped[str] = mapped_column(String(255), nullable=False)
    __table_args__ = (Index("idx_attachments_wo", "work_order_id"),)

    work_order: Mapped[WorkOrderORM] = relationship(
        "WorkOrderORM", back_populates="attachments"
    )


class LicenseStateORM(Base):
    __tablename__ = "license_state"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    license_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_limited: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_check: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class InvoiceORM(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer: Mapped[str] = mapped_column(String(255), nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc)
    )
    __table_args__ = (Index("idx_invoices_customer", "customer"),)


class CfdiDocumentORM(Base):
    __tablename__ = "cfdi_documents"

    uuid: Mapped[str] = mapped_column(String(32), primary_key=True)
    customer: Mapped[str] = mapped_column(String(255), nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    xml_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    pdf_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc)
    )


class CfdiPendingORM(Base):
    __tablename__ = "cfdi_pending"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=lambda: uuid4().hex)
    quote_id: Mapped[str] = mapped_column(String(32), nullable=False)
    customer: Mapped[str] = mapped_column(String(255), nullable=False)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="pending")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(String(255), nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc)
    )


class TaxConfigORM(Base):
    __tablename__ = "tax_config"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    rfc: Mapped[str] = mapped_column(String(64), nullable=False)
    provider: Mapped[str | None] = mapped_column(String(64), nullable=True)
    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc)
    )


class SubscriptionORM(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    customer_id: Mapped[str] = mapped_column(String(64), nullable=False)
    plan_id: Mapped[str] = mapped_column(String(64), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), nullable=False)
    provider_subscription_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=lambda: datetime.now(timezone.utc)
    )

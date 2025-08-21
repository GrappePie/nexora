"""add customer vehicle quote items work orders attachments license state

Revision ID: ba42116aa12c
Revises: 3c6f07d66775
Create Date: 2025-08-21 05:46:08.682673
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'ba42116aa12c'
down_revision = '3c6f07d66775'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("rfc", sa.String(length=64), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=32), nullable=True),
    )
    op.create_index("idx_customers_name", "customers", ["name"], unique=False)

    op.create_table(
        "vehicles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plates", sa.String(length=32), nullable=False, unique=True),
        sa.Column("vin", sa.String(length=64), nullable=True, unique=True),
        sa.Column("make", sa.String(length=64), nullable=True),
        sa.Column("model", sa.String(length=64), nullable=True),
        sa.Column("year", sa.Integer(), nullable=True),
    )
    op.create_index("idx_vehicles_customer", "vehicles", ["customer_id"], unique=False)

    op.create_table(
        "quote_items",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("quote_id", sa.String(length=32), sa.ForeignKey("quotes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False),
        sa.Column("qty", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Float(), nullable=False),
        sa.Column("tax_rate", sa.Float(), nullable=False, server_default="0"),
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.create_table(
        "work_orders",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("quote_id", sa.String(length=32), sa.ForeignKey("quotes.id", ondelete="SET NULL"), nullable=True, unique=True),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "attachments",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("work_order_id", sa.String(length=32), sa.ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("s3_key", sa.String(length=255), nullable=False),
    )
    op.create_index("idx_attachments_wo", "attachments", ["work_order_id"], unique=False)

    op.create_table(
        "license_state",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("license_key", sa.String(length=255), nullable=True),
        sa.Column("is_limited", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("last_check", sa.DateTime(timezone=True), nullable=True),
    )

    op.add_column("quotes", sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.id", ondelete="SET NULL"), nullable=True))
    op.create_index("idx_quotes_customer", "quotes", ["customer_id"], unique=False)
    op.create_index("ux_quotes_approval_token", "quotes", ["token"], unique=True)


def downgrade() -> None:
    op.drop_index("ux_quotes_approval_token", table_name="quotes")
    op.drop_index("idx_quotes_customer", table_name="quotes")
    op.drop_column("quotes", "customer_id")

    op.drop_table("license_state")
    op.drop_index("idx_attachments_wo", table_name="attachments")
    op.drop_table("attachments")
    op.drop_table("work_orders")
    op.drop_table("quote_items")
    op.drop_index("idx_vehicles_customer", table_name="vehicles")
    op.drop_table("vehicles")
    op.drop_index("idx_customers_name", table_name="customers")
    op.drop_table("customers")

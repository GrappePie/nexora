"""initial schema: quotes table

Revision ID: 20250818_0001
Revises:
Create Date: 2025-08-18

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "20250818_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "quotes",
        sa.Column("id", sa.String(length=32), primary_key=True),
        sa.Column("customer", sa.String(length=255), nullable=False),
        sa.Column("total", sa.Float(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False, server_default="pending"),
        sa.Column("token", sa.String(length=64), nullable=False, unique=True),
    )
    op.create_index("ix_quotes_token", "quotes", ["token"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_quotes_token", table_name="quotes")
    op.drop_table("quotes")


"""add stock and invoice indexes

Revision ID: f26643d7b17d
Revises: ba42116aa12c
Create Date: 2025-08-21 07:04:51.632527
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'f26643d7b17d'
down_revision = 'ba42116aa12c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index('idx_stock_item', 'stock', ['item'], unique=False)
    op.create_index('idx_invoices_customer', 'invoices', ['customer'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_invoices_customer', table_name='invoices')
    op.drop_index('idx_stock_item', table_name='stock')

"""add created_at and token_expires_at to quotes

Revision ID: 20250818_0002
Revises: 20250818_0001
Create Date: 2025-08-18 20:20:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250818_0002'
down_revision = '20250818_0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('quotes') as batch_op:
        batch_op.add_column(sa.Column('created_at', sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column('token_expires_at', sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('quotes') as batch_op:
        batch_op.drop_column('token_expires_at')
        batch_op.drop_column('created_at')


"""add reset and verification fields to users

Revision ID: 20250818_0004
Revises: 20250818_0003
Create Date: 2025-08-18 21:30:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20250818_0004'
down_revision = '17413749843f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('users', sa.Column('reset_token', sa.String(length=64), nullable=True))
    op.add_column('users', sa.Column('reset_expires', sa.DateTime(timezone=True), nullable=True))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'reset_expires')
    op.drop_column('users', 'reset_token')

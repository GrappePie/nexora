"""add subscriptions table

Revision ID: 20250818_0006
Revises: 20250818_0005
Create Date: 2025-08-20 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = '20250818_0006'
down_revision = '20250818_0005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'subscriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('customer_id', sa.String(length=64), nullable=False),
        sa.Column('plan_id', sa.String(length=64), nullable=False),
        sa.Column('provider', sa.String(length=32), nullable=False),
        sa.Column('provider_subscription_id', sa.String(length=255), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('provider_subscription_id'),
    )


def downgrade() -> None:
    op.drop_table('subscriptions')

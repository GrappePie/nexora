"""add cfdi documents table

Revision ID: 20250818_0005
Revises: 20250818_0004
Create Date: 2025-08-20 00:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = '20250818_0005'
down_revision = '20250818_0004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'cfdi_documents',
        sa.Column('uuid', sa.String(length=32), nullable=False),
        sa.Column('customer', sa.String(length=255), nullable=False),
        sa.Column('total', sa.Float(), nullable=False),
        sa.Column('xml_url', sa.String(length=1024), nullable=False),
        sa.Column('pdf_url', sa.String(length=1024), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('uuid')
    )


def downgrade() -> None:
    op.drop_table('cfdi_documents')

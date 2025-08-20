"""add users and roles tables

Revision ID: 20250818_0003
Revises: 20250818_0002
Create Date: 2025-08-18 21:00:00.000000
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
import hashlib

# revision identifiers, used by Alembic.
revision = '20250818_0003'
down_revision = '20250818_0002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'roles',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(length=50), nullable=False, unique=True),
    )
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
    )
    op.create_table(
        'user_roles',
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('role_id', sa.Integer(), sa.ForeignKey('roles.id', ondelete='CASCADE'), primary_key=True),
    )
    user_table = sa.table(
        'users',
        sa.column('id', sa.Integer),
        sa.column('email', sa.String),
        sa.column('hashed_password', sa.String),
    )
    role_table = sa.table('roles', sa.column('id', sa.Integer), sa.column('name', sa.String))
    user_roles_table = sa.table(
        'user_roles', sa.column('user_id', sa.Integer), sa.column('role_id', sa.Integer)
    )
    admin_hash = hashlib.sha256('admin'.encode()).hexdigest()
    op.bulk_insert(role_table, [{'id': 1, 'name': 'admin'}])
    op.bulk_insert(user_table, [{'id': 1, 'email': 'admin@example.com', 'hashed_password': admin_hash}])
    op.bulk_insert(user_roles_table, [{'user_id': 1, 'role_id': 1}])


def downgrade() -> None:
    op.drop_table('user_roles')
    op.drop_table('users')
    op.drop_table('roles')

from alembic import op
import sqlalchemy as sa

revision = '20250818_0007'
down_revision = '20250818_0006'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'tax_config',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('rfc', sa.String(length=64), nullable=False),
        sa.Column('provider', sa.String(length=64), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_table(
        'cfdi_pending',
        sa.Column('id', sa.String(length=32), primary_key=True),
        sa.Column('quote_id', sa.String(length=32), nullable=False),
        sa.Column('customer', sa.String(length=255), nullable=False),
        sa.Column('total', sa.Float(), nullable=False),
        sa.Column('status', sa.String(length=16), nullable=False, server_default='pending'),
        sa.Column('attempts', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('last_error', sa.String(length=255), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_table('cfdi_pending')
    op.drop_table('tax_config')

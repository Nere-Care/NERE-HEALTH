"""merge heads
Revision ID: 726b9fe16931
Revises: 0004_create_medicaments, 854a93350b2e
Create Date: 2026-07-13 11:21:47.590849
"""

from alembic import op
import sqlalchemy as sa

revision = '726b9fe16931'
down_revision = ('0004_create_medicaments', '854a93350b2e')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass

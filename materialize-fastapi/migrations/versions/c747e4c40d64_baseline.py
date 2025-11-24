"""baseline

Revision ID: c747e4c40d64
Revises: 3b7fe30a8651
Create Date: 2025-11-24 16:43:44.884662

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c747e4c40d64'
down_revision: Union[str, None] = '3b7fe30a8651'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

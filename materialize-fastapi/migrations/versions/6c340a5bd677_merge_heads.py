"""merge heads

Revision ID: 6c340a5bd677
Revises: 15ea0ceb1448, f2a1b3c4d5e6
Create Date: 2026-02-05 23:49:41.415670

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6c340a5bd677'
down_revision: Union[str, None] = ('15ea0ceb1448', 'f2a1b3c4d5e6')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass

"""users

Revision ID: 5847d94ff882
Revises: e4e36765abe3
Create Date: 2025-11-27 13:47:43.867491

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from migrations.seeders.usersData import USERS

# revision identifiers, used by Alembic.
revision: str = "5847d94ff882"
down_revision: Union[str, None] = "9c48da8d57fc"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, autoincrement=True, nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=50), nullable=False),
        sa.Column("password", sa.String(length=255), nullable=False),
        sa.Column("token", sa.String(length=255), nullable=True),
        sa.Column("refresh_token", sa.String(length=255), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        mysql_collate="latin1_swedish_ci",
        mysql_default_charset="latin1",
        mysql_engine="InnoDB",
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)

    users_table = sa.table(
        "users",
        sa.Column("username", sa.String(length=100)),
        sa.Column("email", sa.String(length=100)),
        sa.Column("password", sa.String(length=100)),
        sa.Column("token", sa.Text),
    )

    op.bulk_insert(users_table, USERS)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_table("users")

"""split roles and user_roles mapping + add user timestamps

Revision ID: b1f2c3d4e5f6
Revises: 7f3c1b9a2d10
Create Date: 2026-02-01

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b1f2c3d4e5f6"
down_revision: Union[str, None] = "7f3c1b9a2d10"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop existing FK from menus to user_roles (name can vary by engine).
    for constraint_name in ("menus_ibfk_1", "fk_menus_role_id", "menus_role_id_fkey"):
        try:
            op.drop_constraint(constraint_name, "menus", type_="foreignkey")
        except Exception:
            pass

    # Rename user_roles table into roles.
    op.rename_table("user_roles", "roles")

    # Add columns to roles.
    op.add_column(
        "roles",
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
    )
    op.add_column("roles", sa.Column("updated_at", sa.DateTime(), nullable=True))

    # Create user_roles mapping table.
    op.create_table(
        "user_roles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "roles_id",
            sa.Integer(),
            sa.ForeignKey("roles.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("user_id", "roles_id", name="uq_user_role"),
    )

    # Re-create FK from menus to roles.
    op.create_foreign_key("fk_menus_role_id", "menus", "roles", ["role_id"], ["id"])

    # Add timestamps to users table.
    op.add_column("users", sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()))
    op.add_column("users", sa.Column("updated_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Drop FK from menus to roles.
    try:
        op.drop_constraint("fk_menus_role_id", "menus", type_="foreignkey")
    except Exception:
        pass

    # Drop user_roles mapping table.
    op.drop_table("user_roles")

    # Remove timestamps from users.
    op.drop_column("users", "updated_at")
    op.drop_column("users", "created_at")

    # Drop added columns and rename roles back to user_roles.
    op.drop_column("roles", "updated_at")
    op.drop_column("roles", "active")
    op.rename_table("roles", "user_roles")

    # Restore FK from menus to user_roles.
    op.create_foreign_key("fk_menus_role_id", "menus", "user_roles", ["role_id"], ["id"])

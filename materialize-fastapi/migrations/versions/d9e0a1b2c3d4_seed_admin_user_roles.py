"""seed admin user and role mapping

Revision ID: d9e0a1b2c3d4
Revises: c2f1a3b4d5e6
Create Date: 2026-02-05

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.utils.auth_util import hash_password

# revision identifiers, used by Alembic.
revision: str = "d9e0a1b2c3d4"
down_revision: Union[str, None] = "c2f1a3b4d5e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


ADMIN_EMAIL = "wisnubaldas@gmail.com"
ADMIN_USERNAME = "wisnubaldas"
ADMIN_PASSWORD = "password123"


def upgrade() -> None:
    conn = op.get_bind()

    role_id = conn.execute(
        sa.text("SELECT id FROM roles WHERE role_name = :name LIMIT 1"),
        {"name": "admin"},
    ).scalar()
    if role_id is None:
        conn.execute(
            sa.text("INSERT INTO roles (role_name, active, created_at) VALUES (:name, 1, NOW())"),
            {"name": "admin"},
        )
        role_id = conn.execute(
            sa.text("SELECT id FROM roles WHERE role_name = :name LIMIT 1"),
            {"name": "admin"},
        ).scalar()

    user_id = conn.execute(
        sa.text("SELECT id FROM users WHERE email = :email LIMIT 1"),
        {"email": ADMIN_EMAIL},
    ).scalar()
    if user_id is None:
        conn.execute(
            sa.text(
                """
                INSERT INTO users (username, email, password, token, refresh_token, created_at, updated_at)
                VALUES (:username, :email, :password, NULL, NULL, NOW(), NOW())
                """
            ),
            {
                "username": ADMIN_USERNAME,
                "email": ADMIN_EMAIL,
                "password": hash_password(ADMIN_PASSWORD),
            },
        )
        user_id = conn.execute(
            sa.text("SELECT id FROM users WHERE email = :email LIMIT 1"),
            {"email": ADMIN_EMAIL},
        ).scalar()

    if user_id is None or role_id is None:
        return

    mapping_exists = conn.execute(
        sa.text(
            "SELECT id FROM user_roles WHERE user_id = :user_id AND roles_id = :role_id LIMIT 1"
        ),
        {"user_id": user_id, "role_id": role_id},
    ).scalar()
    if mapping_exists is None:
        conn.execute(
            sa.text(
                """
                INSERT INTO user_roles (user_id, roles_id, created_at, updated_at)
                VALUES (:user_id, :role_id, NOW(), NOW())
                """
            ),
            {"user_id": user_id, "role_id": role_id},
        )


def downgrade() -> None:
    conn = op.get_bind()
    role_id = conn.execute(
        sa.text("SELECT id FROM roles WHERE role_name = :name LIMIT 1"),
        {"name": "admin"},
    ).scalar()
    user_id = conn.execute(
        sa.text("SELECT id FROM users WHERE email = :email LIMIT 1"),
        {"email": ADMIN_EMAIL},
    ).scalar()

    if role_id and user_id:
        conn.execute(
            sa.text("DELETE FROM user_roles WHERE user_id = :user_id AND roles_id = :role_id"),
            {"user_id": user_id, "role_id": role_id},
        )

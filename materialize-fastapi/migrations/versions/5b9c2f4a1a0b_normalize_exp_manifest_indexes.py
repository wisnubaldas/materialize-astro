"""normalize exp manifest indexes to non-unique

Revision ID: 5b9c2f4a1a0b
Revises: f4c1d9a7e2b3
Create Date: 2026-01-02 13:10:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "5b9c2f4a1a0b"
down_revision: Union[str, None] = "f4c1d9a7e2b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _get_index_non_unique(table_name: str, index_name: str) -> int | None:
    bind = op.get_bind()
    row = bind.execute(
        sa.text(
            """
            SELECT NON_UNIQUE
            FROM information_schema.statistics
            WHERE table_schema = DATABASE()
              AND table_name = :table_name
              AND index_name = :index_name
            LIMIT 1
            """
        ),
        {"table_name": table_name, "index_name": index_name},
    ).fetchone()
    if row is None:
        return None
    return int(row[0])


def _ensure_non_unique_index(table_name: str, index_name: str, columns: list[str]) -> None:
    non_unique = _get_index_non_unique(table_name, index_name)
    if non_unique is None:
        op.create_index(index_name, table_name, columns, unique=False)
        return
    if non_unique == 0:
        op.execute(sa.text(f"DROP INDEX `{index_name}` ON `{table_name}`"))
        op.create_index(index_name, table_name, columns, unique=False)


def _ensure_unique_index(table_name: str, index_name: str, columns: list[str]) -> None:
    non_unique = _get_index_non_unique(table_name, index_name)
    if non_unique is None:
        op.create_index(index_name, table_name, columns, unique=True)
        return
    if non_unique == 1:
        op.execute(sa.text(f"DROP INDEX `{index_name}` ON `{table_name}`"))
        op.create_index(index_name, table_name, columns, unique=True)


def upgrade() -> None:
    _ensure_non_unique_index(
        "exp_manifest_fligt",
        "uk_flight",
        ["flight_number", "flight_date"],
    )
    _ensure_non_unique_index(
        "exp_manifest_uld",
        "uk_uld",
        ["flight_id", "uld_type", "uld_number"],
    )
    _ensure_non_unique_index(
        "exp_manifest_mawb",
        "uk_mawb",
        ["mawb_prefix", "mawb_number"],
    )


def downgrade() -> None:
    _ensure_unique_index(
        "exp_manifest_fligt",
        "uk_flight",
        ["flight_number", "flight_date"],
    )
    _ensure_unique_index(
        "exp_manifest_uld",
        "uk_uld",
        ["flight_id", "uld_type", "uld_number"],
    )
    _ensure_unique_index(
        "exp_manifest_mawb",
        "uk_mawb",
        ["mawb_prefix", "mawb_number"],
    )

"""make tale user_id nullable

Revision ID: b2f3d4e5f6a7
Revises: ab1ec70768e6
Create Date: 2026-04-26 12:00:00.000000

Причина: TaleService.create_tale() и complete_tale() устанавливают
tale.user_id = None для «открепления» сказки от пользователя.
Исходная схема объявляла колонку NOT NULL, что вызывало IntegrityError.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "b2f3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "ab1ec70768e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "tales",
        "user_id",
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade() -> None:
    # Перед откатом убедитесь, что в таблице нет строк с user_id IS NULL,
    # иначе PostgreSQL откажет в применении ограничения NOT NULL.
    op.alter_column(
        "tales",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

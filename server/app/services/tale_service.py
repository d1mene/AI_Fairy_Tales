from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.tale import Tale
from app.schemas.tale import TaleCreate, TaleSizeEnum

class TaleService:
    def __init__(self):
        self.size_map = {
            TaleSizeEnum.TINY: 3,
            TaleSizeEnum.SMALL: 8,
            TaleSizeEnum.MEDIUM: 16,
            TaleSizeEnum.LARGE: 32,
        }

    async def create_tale(self, db: AsyncSession, user_id: int, tale_data: TaleCreate) -> Tale:
        result = await db.execute(select(Tale).where(Tale.user_id == user_id))
        old_tale = result.scalar_one_or_none()
        if old_tale:
            old_tale.user_id = None
            await db.flush()

        tale = Tale(
            name=tale_data.name,
            genre=tale_data.genre,
            size=self.size_map[tale_data.size],
            content=[],
            user_id=user_id
        )
        db.add(tale)
        await db.commit()
        await db.refresh(tale)
        return tale

    async def get_user_tale(self, db: AsyncSession, user_id: int) -> Tale | None:
        result = await db.execute(select(Tale).where(Tale.user_id == user_id))
        return result.scalar_one_or_none()

    async def add_message(self, db: AsyncSession, tale: Tale, user_message: str) -> dict:
        current_stage = len(tale.content)

        if current_stage >= tale.size:
            raise ValueError("Сказка уже закончена")

        bot_response = f"[ВРЕМЕННЫЙ ОТВЕТ] Часть {current_stage + 1} из {tale.size}: {user_message}"

        new_part = {
            "part_number": current_stage + 1,
            "user_message": user_message,
            "assistant_response": bot_response
        }

        # SQLAlchemy не детектирует мутацию JSON через .append() — нужен новый объект
        tale.content = (tale.content or []) + [new_part]
        await db.commit()

        return {
            "part_number": current_stage + 1,
            "user_message": user_message,
            "assistant_response": bot_response,
            "is_completed": (current_stage + 1) >= tale.size
        }

    async def complete_tale(self, db: AsyncSession, tale: Tale) -> str:
        if not tale.content:
            raise ValueError("Сказка пуста")
        
        full_text = f"Название: {tale.name}\nЖанр: {tale.genre}\n\n"
        for part in tale.content:
            full_text += f"Часть {part['part_number']}:\n{part['assistant_response']}\n\n"
        
        tale.user_id = None
        await db.commit()
        
        return full_text

    async def get_last_response(self, tale: Tale) -> str | None:
        if not tale.content:
            return None
        return tale.content[-1].get("assistant_response")
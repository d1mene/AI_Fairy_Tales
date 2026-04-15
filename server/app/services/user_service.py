from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.schemas.user import UserUpdate

class UserService:
    @staticmethod
    async def get_user(db: AsyncSession, user_id: int) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
        result = await db.execute(select(User).where(User.username == username))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_or_create_user_by_username(db: AsyncSession, username: str, name: str = "") -> User:
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                username=username,
                hashed_password="",
                name=name or username,
                age=0,
                hobby="",
                role="USER",
                sex="male"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        return user

    @staticmethod
    async def get_or_create_user(db: AsyncSession, user_id: int, username: str, name: str = "") -> User:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            user = User(
                id=user_id,
                username=username,
                hashed_password="",
                name=name or username,
                age=0,
                hobby="",
                role="USER",
                sex="male"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        
        return user

    @staticmethod
    async def update_profile(db: AsyncSession, user_id: int, update_data: UserUpdate) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            return None
        
        if update_data.name is not None:
            user.name = update_data.name
        if update_data.age is not None:
            user.age = update_data.age
        if update_data.sex is not None:
            user.sex = update_data.sex
        if update_data.hobby is not None:
            user.hobby = update_data.hobby
        
        await db.commit()
        await db.refresh(user)
        return user
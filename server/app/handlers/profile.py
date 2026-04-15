from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/profile", tags=["profile"])

@router.get("/{user_id}", response_model=UserResponse)
async def get_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
async def update_profile(user_id: int, update_data: UserUpdate, db: AsyncSession = Depends(get_db)):
    user = await UserService.update_profile(db, user_id, update_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
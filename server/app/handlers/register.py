from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService
from app.schemas.register import RegisterRequest

router = APIRouter(prefix="/register", tags=["register"])

@router.post("")
async def register_user(user_data: RegisterRequest ,db: AsyncSession = Depends(get_db)):
    user = await UserService.get_user_by_username(db, user_data.username)
    if user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT,
                            detail='Пользователь уже существует')

    try:
        await UserService.create_user(db, user_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail=str(e))

    return {'message': f'Вы успешно зарегистрированы!'}

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.services.user_service import UserService
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    """Профиль текущего пользователя."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_my_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Редактирование полей, не обязательных при регистрации: name, age, sex, hobby.
    Эти поля должны быть заполнены перед генерацией сказки.
    """
    user = await UserService.update_profile(db, current_user.id, update_data)
    return user


@router.get("/me/status", response_model=dict)
async def profile_complete_status(
    current_user: User = Depends(get_current_user),
):
    """
    Возвращает статус заполненности профиля.
    Клиент вызывает этот эндпоинт перед экраном создания сказки,
    чтобы показать подсказку о незаполненных полях.
    """
    is_complete, missing = UserService.is_profile_complete(current_user)
    return {"is_complete": is_complete, "missing_fields": missing}


# ── Оставляем для обратной совместимости ──────────────────────────────────────

@router.get("/{user_id}", response_model=UserResponse)
async def get_profile(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user = await UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.put("/{user_id}", response_model=UserResponse)
async def update_profile(
    user_id: int,
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нельзя редактировать чужой профиль",
        )
    user = await UserService.update_profile(db, user_id, update_data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

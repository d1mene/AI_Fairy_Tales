from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import PlainTextResponse

from app.db.session import get_db
from app.schemas.tale import TaleCreate, TaleResponse, TaleMessageRequest, TalePartResponse
from app.services.tale_service import TaleService
from app.services.user_service import UserService

router = APIRouter(prefix="/tales", tags=["tales"])
tale_service = TaleService()

@router.post("/{user_id}/create", response_model=TaleResponse)
async def create_tale(user_id: int, tale_data: TaleCreate, db: AsyncSession = Depends(get_db)):
    user = await UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    tale = await tale_service.create_tale(db, user_id, tale_data)
    return TaleResponse(
        id=tale.id,
        name=tale.name,
        genre=tale.genre,
        size=tale.size,
        content=tale.content,
        current_stage=len(tale.content),
        is_completed=False
    )

@router.get("/{user_id}/current", response_model=TaleResponse)
async def get_current_tale(user_id: int, db: AsyncSession = Depends(get_db)):
    tale = await tale_service.get_user_tale(db, user_id)
    if not tale:
        raise HTTPException(status_code=404, detail="Нет активной сказки")
    
    return TaleResponse(
        id=tale.id,
        name=tale.name,
        genre=tale.genre,
        size=tale.size,
        content=tale.content,
        current_stage=len(tale.content),
        is_completed=len(tale.content) >= tale.size
    )

@router.post("/{user_id}/add", response_model=TalePartResponse)
async def add_message(user_id: int, request: TaleMessageRequest, db: AsyncSession = Depends(get_db)):
    tale = await tale_service.get_user_tale(db, user_id)
    if not tale:
        raise HTTPException(status_code=404, detail="Нет активной сказки")
    
    if len(tale.content) >= tale.size:
        raise HTTPException(status_code=400, detail="Сказка уже закончена")
    
    result = await tale_service.add_message(db, tale, request.message)
    return TalePartResponse(**result)

@router.get("/{user_id}/last")
async def get_last_part(user_id: int, db: AsyncSession = Depends(get_db)):
    tale = await tale_service.get_user_tale(db, user_id)
    if not tale:
        raise HTTPException(status_code=404, detail="Нет активной сказки")
    
    last_response = await tale_service.get_last_response(tale)
    return {"response": last_response, "stage": len(tale.content)}

@router.post("/{user_id}/complete", response_class=PlainTextResponse)
async def complete_tale(user_id: int, db: AsyncSession = Depends(get_db)):
    tale = await tale_service.get_user_tale(db, user_id)
    if not tale:
        raise HTTPException(status_code=404, detail="Нет активной сказки")
    
    full_text = await tale_service.complete_tale(db, tale)
    return PlainTextResponse(content=full_text, media_type="text/plain")
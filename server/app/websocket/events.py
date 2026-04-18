from sqlalchemy.ext.asyncio import AsyncSession
import asyncio

from app.services.tale_service import TaleService
from app.websocket.manager import manager


class TaleEvents:
    def __init__(self) -> None:
        self._tale_service = TaleService()
    

    async def on_message(self, db: AsyncSession, user_id: int, content: str) -> None:
        tale = await self._tale_service.get_user_tale(db, user_id)
        
        if not tale:
            await self._emit_error(user_id, "Нет активной сказки")
            return
        
        if len(tale.content) >= tale.size:
            await self._emit_error(user_id, "Сказка уже закончена")
            return
        
        try:
            result = await self._tale_service.add_message(db, tale, content)
            await self._emit_stream(
                user_id,
                result["assistant_response"],
                len(tale.content),
                result["is_completed"]
            )
        except Exception as e:
            await self._emit_error(user_id, str(e))
    

    async def on_status_request(self, db: AsyncSession, user_id: int) -> None:
        tale = await self._tale_service.get_user_tale(db, user_id)
        
        if not tale:
            await self._emit_error(user_id, "Нет активной сказки")
            return
        
        await self._emit_event(user_id, "status", {
            "id": tale.id,
            "name": tale.name,
            "genre": tale.genre,
            "size": tale.size,
            "current_stage": len(tale.content),
            "is_completed": len(tale.content) >= tale.size
        })
    

    async def on_history_request(self, db: AsyncSession, user_id: int) -> None:
        tale = await self._tale_service.get_user_tale(db, user_id)
        
        if not tale:
            await self._emit_error(user_id, "Нет активной сказки")
            return
        
        await self._emit_event(user_id, "history", {
            "content": tale.content,
            "current_stage": len(tale.content),
            "total_stages": tale.size,
            "is_completed": len(tale.content) >= tale.size
        })
    

    async def on_last_response_request(self, db: AsyncSession, user_id: int) -> None:
        tale = await self._tale_service.get_user_tale(db, user_id)
        
        if not tale:
            await self._emit_error(user_id, "Нет активной сказки")
            return
        
        last_response = await self._tale_service.get_last_response(tale)
        
        await self._emit_event(user_id, "last_response", {
            "response": last_response,
            "stage": len(tale.content),
            "is_completed": len(tale.content) >= tale.size
        })
    

    async def on_complete_request(self, db: AsyncSession, user_id: int) -> None:
        tale = await self._tale_service.get_user_tale(db, user_id)
        
        if not tale:
            await self._emit_error(user_id, "Нет активной сказки")
            return
        
        try:
            full_text = await self._tale_service.complete_tale(db, tale)
            await self._emit_event(user_id, "tale_completed", {
                "full_text": full_text
            })
        except Exception as e:
            await self._emit_error(user_id, str(e))
    

    async def _emit_stream(
        self,
        user_id: int,
        response: str,
        stage: int,
        is_completed: bool
    ) -> None:
        words = response.split()
        
        for word in words:
            await self._emit_event(user_id, "chunk", {
                "text": word + " ",
                "is_final": False
            })
            await asyncio.sleep(0.05)
        
        await self._emit_event(user_id, "part_complete", {
            "response": response,
            "stage": stage,
            "is_completed": is_completed
        })
    

    async def _emit_event(self, user_id: int, event_type: str, payload: dict) -> None:
        await manager.send_json(user_id, {
            "event": event_type,
            "payload": payload
        })
    
    
    async def _emit_error(self, user_id: int, message: str) -> None:
        await self._emit_event(user_id, "error", {"message": message})


tale_events = TaleEvents()
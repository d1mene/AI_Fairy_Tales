from fastapi import WebSocket
from typing import Dict, Optional
import asyncio


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: Dict[int, WebSocket] = {}
        self._lock: asyncio.Lock = asyncio.Lock()


    async def connect(self, user_id: int, websocket: WebSocket) -> None:
        await websocket.accept()

        async with self._lock:
            if user_id in self._connections:
                await self._close_existing_connection(user_id)
            self._connections[user_id] = websocket


    async def disconnect(self, user_id: int) -> None:
        async with self._lock:
            self._connections.pop(user_id, None)


    async def send_json(self, user_id: int, data: dict) -> bool:
        websocket = self._connections.get(user_id)

        if not websocket:
            return False

        try:
            await websocket.send_json(data)
            return True
        except Exception:
            await self.disconnect(user_id)
            return False
        

    async def broadcast_json(
        self,
        data: dict,
        exclude_user_id: Optional[int] = None,
    ) -> None:
        failed: list[int] = []

        async with self._lock:
            for user_id, websocket in list(self._connections.items()):
                if user_id == exclude_user_id:
                    continue
                try:
                    await websocket.send_json(data)
                except Exception:
                    failed.append(user_id)

        for user_id in failed:
            await self.disconnect(user_id)


    @property
    def active_connections_count(self) -> int:
        return len(self._connections)


    def is_connected(self, user_id: int) -> bool:
        return user_id in self._connections
    

    async def _close_existing_connection(self, user_id: int) -> None:
        old_ws = self._connections.get(user_id)
        
        if old_ws:
            try:
                await old_ws.close(code=1000, reason="New connection established")
            except Exception:
                pass


manager = ConnectionManager()

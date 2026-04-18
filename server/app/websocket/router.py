from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Any, Dict

from app.db.session import get_db
from app.websocket.dependencies import get_ws_current_user
from app.websocket.manager import manager
from app.websocket.events import tale_events


router = APIRouter(prefix="/ws")


@router.websocket("/tales/{user_id}/chat")
async def websocket_tale_chat(
    websocket: WebSocket,
    user_id: int,
    token: str | None = Query(default=None),
) -> None:
    current_user = await get_ws_current_user(websocket, user_id, token)
    if current_user is None:
        return

    await manager.connect(user_id, websocket)

    try:
        while True:
            raw_data: Dict[str, Any] = await websocket.receive_json()
            await _dispatch(user_id, raw_data)

    except WebSocketDisconnect:
        await manager.disconnect(user_id)
    except Exception:
        await manager.disconnect(user_id)
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except Exception:
            pass


async def _dispatch(user_id: int, raw_data: Dict[str, Any]) -> None:
    event_type: str | None = raw_data.get("event")

    if not event_type:
        await manager.send_json(user_id, {
            "event": "error",
            "payload": {"message": "Missing required field: event"},
        })
        return

    async for db in get_db():
        match event_type:
            case "message":
                content: str | None = raw_data.get("content")
                if not content:
                    await manager.send_json(user_id, {
                        "event": "error",
                        "payload": {"message": "Missing required field: content"},
                    })
                else:
                    await tale_events.on_message(db, user_id, content)

            case "get_status":
                await tale_events.on_status_request(db, user_id)

            case "get_history":
                await tale_events.on_history_request(db, user_id)

            case "get_last_response":
                await tale_events.on_last_response_request(db, user_id)

            case "complete_tale":
                await tale_events.on_complete_request(db, user_id)

            case _:
                await manager.send_json(user_id, {
                    "event": "error",
                    "payload": {"message": f"Unknown event: {event_type}"},
                })
        break

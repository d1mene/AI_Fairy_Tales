from fastapi import WebSocket
from jose import JWTError, jwt

from app.db.session import get_db
from app.models.user import User
from app.services.user_service import UserService
from app.utils.security import SECRET_KEY, ALGORITHM


async def get_ws_current_user(
    websocket: WebSocket,
    user_id: int,
    token: str | None,
) -> User | None:
    async def reject(reason: str) -> None:
        await websocket.close(code=1008, reason=reason)

    if not token:
        await reject("Authentication required: pass ?token=<jwt>")
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            await reject("Invalid token: missing subject claim")
            return None
        token_user_id = int(sub)

    except (JWTError, ValueError):
        await reject("Invalid or expired token")
        return None

    if token_user_id != user_id:
        await reject("Access denied: token does not match the requested user")
        return None

    async for db in get_db():
        user = await UserService.get_user(db, token_user_id)
        if user is None:
            await reject("User not found")
            return None
        return user

from jose import jwt
from datetime import datetime, timedelta
from app.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"

def create_access_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(minutes=60)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
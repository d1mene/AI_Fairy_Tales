from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "secret" #потом в env бахнем
ALGORITHM = "HS256"  #ну и это наверное

def create_access_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(minutes=60)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class SexEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=5, max_length=128)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
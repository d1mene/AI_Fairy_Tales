from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class SexEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=5, max_length=128)
    name: str = Field(default="", max_length=50)
    age: Optional[int] = Field(default=None, ge=0, le=120)
    sex: Optional[SexEnum] = None
    hobby: Optional[str] = Field(default="", max_length=500)
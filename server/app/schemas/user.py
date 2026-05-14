from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum

class SexEnum(str, Enum):
    MALE = "male"
    FEMALE = "female"

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=50)
    age: Optional[int] = Field(None, ge=0, le=120)
    sex: Optional[SexEnum] = None
    hobby: Optional[str] = Field(None, max_length=500)

class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    age: int
    sex: Optional[str]
    hobby: str
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    name: str = Field(default="", max_length=50)
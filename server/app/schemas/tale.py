from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class TaleSizeEnum(str, Enum):
    TINY = "tiny"
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"

class TaleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    genre: str = Field(..., min_length=1, max_length=100)
    size: TaleSizeEnum = TaleSizeEnum.SMALL

class TaleMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)

class TalePartResponse(BaseModel):
    response: str
    stage: int
    is_completed: bool

class TaleResponse(BaseModel):
    id: int
    name: str
    genre: str
    size: int
    content: List[dict]
    current_stage: int
    is_completed: bool
    
    class Config:
        from_attributes = True
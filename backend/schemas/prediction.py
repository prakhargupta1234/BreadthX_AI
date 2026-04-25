from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict


class PredictionOut(BaseModel):
    id: int
    user_id: int
    filename: str
    result: str
    confidence: float
    all_scores: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

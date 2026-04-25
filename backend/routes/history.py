from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from database import get_db
from models.prediction import Prediction
from models.user import User
from schemas.prediction import PredictionOut
from auth.dependencies import get_current_user

router = APIRouter(prefix="/history", tags=["History"])


# ── GET /history ───────────────────────────────────────────────────────────────
@router.get("/", response_model=List[dict])
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(Prediction)
        .filter(Prediction.user_id == current_user.id)
        .order_by(Prediction.created_at.desc())
        .all()
    )

    return [
        {
            "id": r.id,
            "filename": r.filename,
            "result": r.result,
            "confidence": r.confidence,
            "all_scores": json.loads(r.all_scores) if r.all_scores else {},
            "created_at": r.created_at,
        }
        for r in records
    ]


# ── DELETE /history/{id} ───────────────────────────────────────────────────────
@router.delete("/{prediction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prediction(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(Prediction).filter(Prediction.id == prediction_id).first()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    if record.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    db.delete(record)
    db.commit()

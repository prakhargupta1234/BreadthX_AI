from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
import shutil
import uuid
import json
import sys

from database import get_db
from models.prediction import Prediction
from models.user import User
from schemas.prediction import PredictionOut
from auth.dependencies import get_current_user

# ── Load the ML predictor once at module level (not per-request) ───────────────
# Add root ml/ to path (backend/ lives one level below project root)
_ml_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "ml")
sys.path.insert(0, os.path.abspath(_ml_path))

_model_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "disease_classifier.pth"
)

from inference import DiseasePredictor  # noqa: E402  (import after sys.path update)

predictor = DiseasePredictor(model_path=os.path.abspath(_model_path))

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter(tags=["Prediction"])


# ── POST /predict ──────────────────────────────────────────────────────────────
@router.post("/predict")
def predict_audio(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename.lower().endswith(".wav"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a .wav file.",
        )

    file_id = str(uuid.uuid4())
    temp_path = os.path.join(UPLOAD_DIR, f"{file_id}.wav")

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Run inference (ML code untouched)
        ml_result = predictor.predict(temp_path)

        if "error" in ml_result:
            raise HTTPException(status_code=500, detail=ml_result["error"])

        # Normalize output: confidence 0→1 to percentage
        confidence_pct = round(ml_result["confidence"] * 100, 1)
        all_probs = ml_result.get("all_probabilities", {})
        all_scores = {k: round(v * 100, 1) for k, v in all_probs.items()}

        # Persist to DB
        record = Prediction(
            user_id=current_user.id,
            filename=file.filename,
            result=ml_result["prediction"],
            confidence=confidence_pct,
            all_scores=json.dumps(all_scores),
        )
        db.add(record)
        db.commit()
        db.refresh(record)

        return {
            "id": record.id,
            "prediction": ml_result["prediction"],
            "confidence": confidence_pct,
            "all_scores": all_scores,
            "created_at": record.created_at,
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

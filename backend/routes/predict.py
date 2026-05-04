from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
import shutil
import uuid
import json
import sys
import traceback

from database import get_db
from models.prediction import Prediction
from models.user import User
from schemas.prediction import PredictionOut
from auth.dependencies import get_current_user
from auth.email import send_report_email

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

ALLOWED_EXTENSIONS = (".wav", ".webm", ".ogg", ".mp3", ".m4a")

router = APIRouter(tags=["Prediction"])


def _convert_to_wav(src_path: str, dst_path: str) -> bool:
    """Convert any audio file to 16-bit PCM WAV using available tools."""
    try:
        import soundfile as sf
        import librosa

        # librosa can read many formats via soundfile/audioread
        audio_np, sr = librosa.load(src_path, sr=16000)
        sf.write(dst_path, audio_np, 16000, subtype="PCM_16")
        return True
    except Exception as e:
        print(f"[predict] soundfile/librosa conversion failed: {e}")

    # Fallback: try pydub (needs ffmpeg)
    try:
        from pydub import AudioSegment
        seg = AudioSegment.from_file(src_path)
        seg = seg.set_frame_rate(16000).set_channels(1).set_sample_width(2)
        seg.export(dst_path, format="wav")
        return True
    except Exception as e:
        print(f"[predict] pydub conversion failed: {e}")

    return False


# ── POST /predict ──────────────────────────────────────────────────────────────
@router.post("/predict")
def predict_audio(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    file_id = str(uuid.uuid4())
    raw_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    wav_path = os.path.join(UPLOAD_DIR, f"{file_id}.wav")

    try:
        # Save uploaded bytes
        with open(raw_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"[predict] Saved upload: {raw_path}  size={os.path.getsize(raw_path)}")

        # If not already wav, convert
        if ext != ".wav":
            ok = _convert_to_wav(raw_path, wav_path)
            if not ok:
                raise HTTPException(
                    status_code=500,
                    detail="Could not convert audio to WAV. Please upload a .wav file instead.",
                )
        else:
            wav_path = raw_path  # already wav

        # Run inference (ML code untouched)
        ml_result = predictor.predict(wav_path)

        if "error" in ml_result:
            print(f"[predict] ML error: {ml_result['error']}")
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

        # Send report email in background
        background_tasks.add_task(send_report_email, current_user.email, ml_result["prediction"], confidence_pct)

        return {
            "id": record.id,
            "prediction": ml_result["prediction"],
            "confidence": confidence_pct,
            "all_scores": all_scores,
            "created_at": record.created_at,
        }

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")
    finally:
        for p in (raw_path, wav_path):
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except OSError:
                    pass

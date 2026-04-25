from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import uuid
import sys

# Import Inference Module
sys.path.append(os.path.join(os.path.dirname(__file__), "ml"))
from inference import DiseasePredictor

app = FastAPI(title="Respiratory Disease Classifier API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize predictor
# It will load 'disease_classifier.pth' if it exists in the root folder, else use untrained dummy
MODEL_PATH = "disease_classifier.pth"
predictor = DiseasePredictor(model_path=MODEL_PATH)

# Ensure upload directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/predict")
async def predict_audio(file: UploadFile = File(...)):
    if not file.filename.endswith(".wav"):
        return JSONResponse(status_code=400, content={"error": "Unsupported file format. Please upload or record a .wav file."})
    
    # Save uploaded file temporarily
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    temp_file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Predict using the ML model
        result = predictor.predict(temp_file_path)
        
        # Clean up
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            
        if "error" in result:
            return JSONResponse(status_code=500, content=result)
            
        return result
        
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        return JSONResponse(status_code=500, content={"error": str(e)})

# Mount static files (Frontend)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

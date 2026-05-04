from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import Base, engine
from models import user, prediction  # noqa: F401

from routes.auth import router as auth_router
from routes.predict import router as predict_router
from routes.history import router as history_router
from auth.dependencies import get_current_user
from schemas.user import UserOut

# SAFE DB INIT (Modern Lifespan approach)
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="BreatheX AI — Respiratory Disease Classification API",
    version="1.0.0",
    lifespan=lifespan
)

# ✅ ROBUST CORS CONFIGURATION
# This handles the pre-flight OPTIONS requests and matches exact frontend origins.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_router)
app.include_router(predict_router)
app.include_router(history_router)


# USER PROFILE
@app.get("/me", response_model=UserOut)
def get_profile(current_user=Depends(get_current_user)):
    return current_user


# HEALTH CHECK
@app.get("/health")
def health():
    return {"status": "ok"}


# RUN
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
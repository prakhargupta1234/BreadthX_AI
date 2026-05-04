from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import timedelta

from database import get_db
from models.user import User
from schemas.user import UserCreate, UserLogin, Token, UserOut
from auth.jwt import create_access_token, decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from auth.email import send_verification_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ✅ Production-Ready Password Hashing
# Argon2 is explicitly supported and installed via passlib[argon2]
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# ── PASSWORD HELPERS ─────────────────────────────────────────

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


from sqlalchemy.exc import IntegrityError

# ── SIGNUP ────────────────────────────────────────────────────

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # 1. Pre-process (Non-DB heavy work like password hashing)
    hashed_pwd = hash_password(payload.password)

    # 2. Atomic Transaction Block
    try:
        # We attempt the insert directly. If the email exists, it raises IntegrityError.
        user = User(
            name=payload.name,
            email=payload.email,
            password=hashed_pwd,
            is_verified=False,  # Require email verification
        )

        db.add(user)
        db.commit()   # CRITICAL: Release locks immediately after write
        db.refresh(user)
    except IntegrityError:
        db.rollback() # Release the lock immediately
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    except Exception as e:
        db.rollback() # CRITICAL: Release locks on failure
        print(f"[Signup Error] {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during registration")

    # 3. Post-Transaction (Token generation & Background tasks)
    # This happens AFTER the DB lock is released.
    verification_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    try:
        background_tasks.add_task(send_verification_email, user.email, verification_token)
    except Exception as e:
        print(f"Background task for email failed: {e}")

    return {"message": "User registered successfully. Please check your email to activate your account."}


from fastapi.responses import RedirectResponse

# ── VERIFY EMAIL ──────────────────────────────────────────────

@router.get("/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == int(user_id)).first()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if not user.is_verified:
        user.is_verified = True
        db.commit()

    # Redirect to frontend login page
    return RedirectResponse(url="http://localhost:5173/login?verified=true")


# ── LOGIN ─────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
def login(payload: UserLogin, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email first",
        )

    # create token
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user),
    )
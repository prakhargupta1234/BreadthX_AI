from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from urllib.parse import quote_plus
from config import settings

# ── Credentials ────────────────────────────────────────────────────────────────
DB_NAME = settings.DB_NAME
DB_USER = settings.DB_USER
DB_PASS = settings.DB_PASS
DB_HOST = settings.DB_HOST
DB_PORT = settings.DB_PORT

# URL-encode the password so '@', '#', etc. don't break the connection string
_encoded_pass = quote_plus(DB_PASS)

# ── Step 1: Connect without specifying a database to create it if needed ───────
_root_url = f"mysql+pymysql://{DB_USER}:{_encoded_pass}@{DB_HOST}:{DB_PORT}/"
_root_engine = create_engine(_root_url, echo=False)

with _root_engine.connect() as conn:
    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`"))

_root_engine.dispose()

# ── Step 2: Connect to the actual DB ───────────────────────────────────────────
DATABASE_URL = f"mysql+pymysql://{DB_USER}:{_encoded_pass}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,   # auto-reconnect on stale connections
    pool_recycle=3600,    # recycle connections every hour
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()


# ── Dependency for FastAPI routes ──────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

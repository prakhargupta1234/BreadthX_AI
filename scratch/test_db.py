import os
from sqlalchemy import create_engine, text
from urllib.parse import quote_plus
from dotenv import load_dotenv

load_dotenv(dotenv_path='backend/.env')

DB_NAME = os.getenv("DB_NAME", "respiratory_ai")
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASS", "prakhar22@")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", 3306)

_encoded_pass = quote_plus(DB_PASS)
_root_url = f"mysql+pymysql://{DB_USER}:{_encoded_pass}@{DB_HOST}:{DB_PORT}/"

print(f"Connecting to {DB_HOST}:{DB_PORT} as {DB_USER}...")
try:
    _root_engine = create_engine(_root_url, echo=False)
    with _root_engine.connect() as conn:
        print("Connected! Checking database...")
        conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}`"))
        print(f"Database `{DB_NAME}` ensured.")
except Exception as e:
    print(f"Error: {e}")

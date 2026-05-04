
from sqlalchemy import text
import sys
import os

sys.path.append(os.path.join(os.getcwd(), 'backend'))
from database import engine

try:
    with engine.connect() as conn:
        res = conn.execute(text("DESCRIBE users"))
        columns = res.fetchall()
        for col in columns:
            print(col)
except Exception as e:
    print(f"Error: {e}")

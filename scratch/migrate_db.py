from sqlalchemy import text
import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from database import engine

def migrate():
    try:
        with engine.connect() as conn:
            # Check if column exists first
            res = conn.execute(text("SHOW COLUMNS FROM users LIKE 'is_verified'"))
            if not res.fetchone():
                print("Adding is_verified column...")
                conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE NOT NULL"))
                conn.commit()
                print("Migration successful.")
            else:
                print("Column is_verified already exists.")
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()

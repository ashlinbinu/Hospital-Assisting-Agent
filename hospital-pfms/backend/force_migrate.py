from app.database import engine
from sqlalchemy import text

def add_missing_columns():
    print("🚀 Connecting to PostgreSQL...")
    with engine.connect() as conn:
        try:
            # Inject the priority_level column
            conn.execute(text("ALTER TABLE patients ADD COLUMN priority_level VARCHAR(50) DEFAULT 'Pending';"))
            print("✅ Added 'priority_level' column.")
            
            # Inject the priority_score column
            conn.execute(text("ALTER TABLE patients ADD COLUMN priority_score FLOAT DEFAULT 0.0;"))
            print("✅ Added 'priority_score' column.")
            
            conn.commit()
            print("🎉 Database successfully upgraded!")
            
        except Exception as e:
            print(f"⚠️ Could not add columns (they might already exist): {e}")

if __name__ == "__main__":
    add_missing_columns()
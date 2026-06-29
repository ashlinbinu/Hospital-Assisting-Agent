import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

# Load variables from .env file
load_dotenv()

# Format: postgresql://[user]:[password]@[host]:[port]/[database_name]
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:1234@localhost:5432/Hospital_flow"
)

# Create the engine that interfaces with the actual Postgres server
engine = create_engine(DATABASE_URL)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for your SQL models
Base = declarative_base()

# This is the exact function FastAPI is looking for!
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from app.database import Base
import datetime

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    contact_number = Column(String(20), nullable=False)
    symptoms_description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Add these two missing columns for the AI Triage Engine! 👇
    priority_level = Column(String(50), nullable=True, default="Pending")
    priority_score = Column(Float, nullable=True, default=0.0)
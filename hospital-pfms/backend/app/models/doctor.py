from sqlalchemy import Column, Integer, String, Time, Boolean
from app.database import Base

class Doctor(Base):
    __tablename__ = "doctors"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    department = Column(String(50), nullable=False)
    availability_start = Column(Time, nullable=False)
    availability_end = Column(Time, nullable=False)
    consultation_duration = Column(Integer, default=15)
    is_active = Column(Boolean, default=True)
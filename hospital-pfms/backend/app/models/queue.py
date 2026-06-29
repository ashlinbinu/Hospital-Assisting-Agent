from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from app.database import Base
import datetime

class Queue(Base):
    __tablename__ = "queues"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"), unique=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"))
    current_position = Column(Integer, nullable=False)
    priority_tier = Column(String, default="Low") # Low, Medium, High, Critical
    priority_score = Column(Integer, default=1)
    estimated_wait_time = Column(Integer, default=0)
    checked_in_at = Column(DateTime, default=datetime.datetime.utcnow)
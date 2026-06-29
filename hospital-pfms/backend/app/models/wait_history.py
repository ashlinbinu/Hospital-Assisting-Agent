from sqlalchemy import Column, Integer, String, Float, DateTime
from app.database import Base
import datetime

class WaitHistory(Base):
    __tablename__ = "wait_history"

    id = Column(Integer, primary_key=True, index=True)
    queue_length = Column(Integer, nullable=False)
    department = Column(String(100), nullable=False)
    avg_duration = Column(Integer, nullable=False)
    wait_time = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

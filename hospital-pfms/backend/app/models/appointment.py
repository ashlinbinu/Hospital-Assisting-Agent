from sqlalchemy import Column, Integer, Date, Time, String, ForeignKey
from app.database import Base
import enum

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id", ondelete="CASCADE"))
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"))
    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(Time, nullable=False)
    status = Column(String, default="Scheduled") # Scheduled, Completed, Cancelled
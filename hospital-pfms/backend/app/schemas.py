from pydantic import BaseModel, Field
from typing import Optional

# 1. Input format for checking in a patient
class PatientTriageRequest(BaseModel):
    name: str = Field(..., example="John Doe")
    age: int = Field(..., ge=0, example=34)
    gender: str = Field(..., example="Male")
    contact_number: str = Field(..., example="555-0199")
    symptoms: str = Field(..., example="Severe pressure in central chest area.")

# 2. Output format returned to your frontend
class TriageResponse(BaseModel):
    patient_id: int
    priority_level: str
    priority_score: int
    emergency_flag: bool
    status_message: str

# 3. Input format for scheduling appointments
class AppointmentBookingRequest(BaseModel):
    patient_id: int
    department: str = Field(..., example="General Medicine")
    preferred_date: str = Field(..., example="2026-07-01")
    preferred_time: str = Field(..., example="10:30")

# 4. Output format for scheduling appointments
class AppointmentBookingResponse(BaseModel):
    status: str
    doctor_id: Optional[int]
    summary: str
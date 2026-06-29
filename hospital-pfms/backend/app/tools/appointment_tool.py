import datetime
from app.database import SessionLocal
import app.models as models

def book_appointment_slot(patient_id: int, doctor_id: int, date_str: str, time_str: str):
    """Attempts to allocate a specific timestamp block to a patient id profile."""
    db = SessionLocal()
    try:
        # Convert strings to standard Python date/time objects
        appt_date = datetime.datetime.strptime(date_str, "%Y-%m-%d").date()
        appt_time = datetime.datetime.strptime(time_str, "%H:%M").time()
        
        # Validate the patient exists before creating a booking
        patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
        if not patient:
            return f"Failed to register appointment slot execution: Patient id {patient_id} not found."

        # Validate the doctor exists before creating a booking
        doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
        if not doctor:
            return f"Failed to register appointment slot execution: Doctor id {doctor_id} not found."

        # Check for matching structural double-bookings
        conflict = db.query(models.Appointment).filter(
            models.Appointment.doctor_id == doctor_id,
            models.Appointment.appointment_date == appt_date,
            models.Appointment.appointment_time == appt_time,
            models.Appointment.status == "Scheduled"
        ).first()
        
        if conflict:
            return f"Error: Slot {time_str} on {date_str} is already reserved for Doctor #{doctor_id}."
            
        # Create and write transaction row sequence
        new_appointment = models.Appointment(
            patient_id=patient_id,
            doctor_id=doctor_id,
            appointment_date=appt_date,
            appointment_time=appt_time,
            status="Scheduled"
        )
        db.add(new_appointment)
        db.commit()
        return f"Success: Appointment confirmed for Patient #{patient_id} with Doctor #{doctor_id} on {date_str} at {time_str}."
    except Exception as e:
        db.rollback()
        return f"Failed to register appointment slot execution: {str(e)}"
    finally:
        db.close()
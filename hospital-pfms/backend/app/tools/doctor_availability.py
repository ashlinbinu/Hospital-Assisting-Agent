from app.database import SessionLocal
import app.models as models

def check_doctor_availability(department: str = None):
    """Fetches all active doctors or filters them by department."""
    db = SessionLocal()
    try:
        query = db.query(models.Doctor).filter(models.Doctor.is_active == True)
        if department:
            query = query.filter(models.Doctor.department.ilike(f"%{department}%"))
        doctors = query.all()
        
        if not doctors:
            return f"No active doctors found in the '{department}' department."
            
        result = []
        for d in doctors:
            result.append({
                "doctor_id": d.id,
                "name": d.name,
                "department": d.department,
                "hours": f"{d.availability_start} - {d.availability_end}",
                "slot_duration_mins": d.consultation_duration
            })
        return result
    finally:
        db.close()
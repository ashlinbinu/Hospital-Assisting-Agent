from app.database import SessionLocal
import app.models as models

def fetch_patient_profile(patient_id: int):
    """Verifies that the target user profile identifier exists inside the database engine matrix."""
    db = SessionLocal()
    try:
        patient = db.query(models.Patient).filter(models.Patient.id == patient_id).first()
        if not patient:
            return f"Patient identity locator verification failure matching ID #{patient_id}."
        return {
            "id": patient.id,
            "name": patient.name,
            "age": patient.age,
            "symptoms": patient.symptoms_description
        }
    finally:
        db.close()
from sqlalchemy.orm import Session
from sqlalchemy import func
import app.models as models

def generate_daily_analytics_report(db: Session) -> dict:
    """
    Queries the database using SQL aggregates to fetch administrative 
    and volume KPIs for the real-time hospital supervisor dashboard.
    """
    try:
        # 1. Calculate total check-ins today
        total_patients = db.query(func.count(models.Patient.id)).scalar() or 0
        
        # 2. Count active waiting cases vs critical emergencies
        critical_cases = db.query(func.count(models.Patient.id)).filter(
            models.Patient.priority_level == "Critical"
        ).scalar() or 0
        
        # 3. Aggregate average queue processing severity score
        raw_avg = db.query(func.avg(models.Patient.priority_score)).scalar()
        avg_score = float(raw_avg) if raw_avg is not None else 0.0
        
        # 4. Count appointments scheduled across departments by joining doctors
        dept_breakdown = db.query(
            models.Doctor.department,
            func.count(models.Appointment.id)
        ).join(
            models.Doctor,
            models.Appointment.doctor_id == models.Doctor.id
        ).group_by(models.Doctor.department).all()

        priority_distribution = db.query(
            models.Patient.priority_level,
            func.count(models.Patient.id)
        ).group_by(models.Patient.priority_level).all()

        priority_averages = db.query(
            models.Patient.priority_level,
            func.avg(models.Patient.priority_score)
        ).group_by(models.Patient.priority_level).all()

        recent_patients = db.query(models.Patient).order_by(models.Patient.created_at.desc()).limit(20).all()
        formatted_patients = []
        for patient in recent_patients:
            queue_position = db.query(models.Queue.current_position).filter(models.Queue.patient_id == patient.id).scalar()
            scheduled_appointments = db.query(func.count(models.Appointment.id)).filter(
                models.Appointment.patient_id == patient.id,
                models.Appointment.status == "Scheduled"
            ).scalar() or 0

            formatted_patients.append({
                "id": patient.id,
                "name": patient.name,
                "age": patient.age,
                "gender": patient.gender,
                "priority_level": patient.priority_level,
                "priority_score": float(patient.priority_score or 0.0),
                "symptoms_description": patient.symptoms_description,
                "created_at": patient.created_at.isoformat() if patient.created_at else None,
                "queue_position": queue_position,
                "scheduled_appointments": scheduled_appointments
            })

        priority_distribution_map = {level or "Unknown": count for level, count in priority_distribution}
        priority_average_map = {level or "Unknown": round(float(avg or 0.0), 2) for level, avg in priority_averages}

        return {
            "summary": {
                "total_processed_patients": total_patients,
                "active_critical_emergencies": critical_cases,
                "average_severity_score": round(avg_score, 2)
            },
            "departmental_load": {dept: count for dept, count in dept_breakdown},
            "priority_distribution": priority_distribution_map,
            "priority_average_scores": priority_average_map,
            "recent_patients": formatted_patients
        }
    except Exception as e:
        return {"error": f"Failed to gather analytical metrics: {str(e)}"}
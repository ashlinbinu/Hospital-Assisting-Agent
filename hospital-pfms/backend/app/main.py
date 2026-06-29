from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
# Check that these lines use your exact file layout names:
from app.agents.queue_agent import queue_agent
from app.agents.report_agent import generate_daily_analytics_report
from app.agents.severity_agent import severity_agent
from app.agents.scheduling_agent import scheduling_agent

# Import our unified models package and database session tools
from app.database import get_db, engine
import app.models as models
import app.schemas as schemas

from app.ml.predict import predict_patient_wait_time
from app.utils.history_cleanup import archive_and_retrain_previous_day
from app.utils.doctor_seeder import seed_doctors, get_doctors

# This line ensures all your separate tables are built/verified on startup
models.Base.metadata.create_all(bind=engine)
# Seed the doctors if none exist yet
seed_doctors()

app = FastAPI(
    title="AI-Powered Hospital Patient Flow Management System",
    description="Operational engine backend with FastAPI, LangGraph, and PostgreSQL.",
    version="1.0.0"
)

# Enable CORS so your React frontend can talk to this backend later without being blocked
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development stage MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Hospital Flow Management API is running smoothly."
    }

@app.get("/api/health-check")
def test_database_connection(db: Session = Depends(get_db)):
    """
    Test endpoint to verify Python can talk directly to your PostgreSQL database.
    """
    try:
        # Run a lightweight raw SQL query to test connection integrity
        result = db.execute(text("SELECT 1")).scalar()
        if result == 1:
            return {
                "database": "connected",
                "message": "SQLAlchemy successfully pinged PostgreSQL!"
            }
        else:
            raise HTTPException(status_code=500, detail="Unexpected response from database.")
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Database connection failure: {str(e)}"
        )

@app.post("/api/triage/check-in", response_model=schemas.TriageResponse)
def check_in_and_triage_patient(payload: schemas.PatientTriageRequest, db: Session = Depends(get_db)):
    """
    Unified Endpoint: Registers a patient, invokes severity_agent to rank the condition via AI,
    and calls queue_agent to reorder the hospital queue in real-time.
    """
    try:
        # 1. Save general demographic information to the patients table
        new_patient = models.Patient(
            name=payload.name,
            age=payload.age,
            gender=payload.gender,
            contact_number=payload.contact_number,
            symptoms_description=payload.symptoms
        )
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        
        # 2. Invoke Phase 1: AI Severity Analysis Graph
        severity_input = {
            "patient_id": new_patient.id,
            "symptoms": new_patient.symptoms_description,
            "priority_level": "Low",
            "priority_score": 1,
            "emergency_flag": False,
            "status_message": ""
        }
        severity_output = severity_agent.invoke(severity_input)

        # Persist the triage metadata back onto the patient profile
        new_patient.priority_level = severity_output.get("priority_level", "Pending")
        new_patient.priority_score = severity_output.get("priority_score", 0.0)
        db.add(new_patient)
        db.commit()
        db.refresh(new_patient)
        
        # 3. Invoke Phase 2: Dynamic Queue Reordering Graph
        # We will default to Doctor ID: 1 (Dr. Emily Smith - Gen Med) for this operational test flow
        queue_input = {
            "patient_id": new_patient.id,
            "doctor_id": 1, 
            "priority_level": severity_output["priority_level"],
            "priority_score": severity_output["priority_score"],
            "status_message": ""
        }
        queue_output = queue_agent.invoke(queue_input)
        
        return {
            "patient_id": new_patient.id,
            "priority_level": severity_output["priority_level"],
            "priority_score": severity_output["priority_score"],
            "emergency_flag": severity_output["emergency_flag"],
            "status_message": queue_output["status_message"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Triage check-in routine failed: {str(e)}")
    
    # Add this import at the top of main.py
from app.agents.report_agent import generate_daily_analytics_report

@app.get("/api/reports/daily")
def get_hospital_analytics(db: Session = Depends(get_db)):
    """
    Gathers an operational diagnostic summary overview of patient distributions,
    emergency counts, and general metrics for dashboard statistics.
    """
    report = generate_daily_analytics_report(db)
    if "error" in report:
        raise HTTPException(status_code=500, detail=report["error"])
    return report


@app.post("/api/maintenance/archive-previous-day")
def archive_previous_day_data():
    """Archive previous-day queue records into wait_history and retrain the wait-time model."""
    try:
        archive_and_retrain_previous_day()
        return {
            "status": "success",
            "message": "Previous-day queue data archived and wait-time model retrained."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Maintenance task failed: {str(e)}")


@app.post("/api/maintenance/reset-current-patients")
def reset_current_patient_data(db: Session = Depends(get_db)):
    """Flush current patient, queue, and appointment records so the day starts fresh."""
    try:
        db.query(models.Appointment).delete(synchronize_session=False)
        db.query(models.Queue).delete(synchronize_session=False)
        db.query(models.Patient).delete(synchronize_session=False)
        db.commit()
        return {
            "status": "success",
            "message": "Flushed current patient, queue, and appointment records. Ready to start anew."
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reset current patient data failed: {str(e)}")


@app.post("/api/maintenance/seed-doctors")
def seed_doctor_records():
    """Seed doctor records into the database if none exist."""
    try:
        result = seed_doctors()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Doctor seeding failed: {str(e)}")


@app.get("/api/doctors")
def list_doctors():
    """Return the current list of doctors."""
    try:
        return get_doctors()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list doctors: {str(e)}")


@app.get("/api/departments")
def list_departments(db: Session = Depends(get_db)):
    """Return all distinct doctor departments available for the dropdown."""
    try:
        department_rows = db.query(models.Doctor.department).distinct().order_by(models.Doctor.department).all()
        departments = [row[0] for row in department_rows]
        return {"departments": departments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list departments: {str(e)}")


@app.get("/api/departments/{department}/doctors")
def list_department_doctors(department: str, db: Session = Depends(get_db)):
    """Return doctors filtered by department for the second dropdown."""
    try:
        doctors = db.query(models.Doctor).filter(
            models.Doctor.department == department,
            models.Doctor.is_active == True
        ).all()

        return [
            {
                "id": d.id,
                "name": d.name,
                "department": d.department,
                "availability_start": d.availability_start.strftime("%H:%M") if d.availability_start else None,
                "availability_end": d.availability_end.strftime("%H:%M") if d.availability_end else None,
                "consultation_duration": d.consultation_duration,
                "is_active": d.is_active
            }
            for d in doctors
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list doctors for department '{department}': {str(e)}")


@app.get("/api/doctors/{doctor_id}/schedule")
def get_doctor_schedule(doctor_id: int, db: Session = Depends(get_db)):
    """Return the doctor schedule with appointments and patient details."""
    try:
        doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=404, detail=f"Doctor id {doctor_id} not found.")

        appointments = db.query(models.Appointment, models.Patient).join(
            models.Patient,
            models.Appointment.patient_id == models.Patient.id
        ).filter(
            models.Appointment.doctor_id == doctor_id
        ).order_by(models.Appointment.appointment_date, models.Appointment.appointment_time).all()

        appointment_list = [
            {
                "appointment_id": appt.id,
                "patient_id": patient.id,
                "patient_name": patient.name,
                "appointment_date": appt.appointment_date.isoformat() if appt.appointment_date else None,
                "appointment_time": appt.appointment_time.strftime("%H:%M") if appt.appointment_time else None,
                "status": appt.status
            }
            for appt, patient in appointments
        ]

        return {
            "doctor": {
                "id": doctor.id,
                "name": doctor.name,
                "department": doctor.department,
                "availability_start": doctor.availability_start.strftime("%H:%M") if doctor.availability_start else None,
                "availability_end": doctor.availability_end.strftime("%H:%M") if doctor.availability_end else None,
                "consultation_duration": doctor.consultation_duration,
                "is_active": doctor.is_active
            },
            "appointments": appointment_list
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch schedule for Doctor id {doctor_id}: {str(e)}")


@app.get("/api/predictions/wait-time")
def get_ml_predicted_wait_time(queue_length: int, department: str, average_duration: int = 15):
    """
    Takes live room details and evaluates the trained Random Forest 
    Regressor model to output an exact estimated waiting matrix value.
    """
    try:
        predicted_minutes = predict_patient_wait_time(
            queue_len=queue_length,
            department=department,
            avg_dur=average_duration
        )
        return {
            "department": department,
            "current_queue_length": queue_length,
            "estimated_wait_time_minutes": predicted_minutes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ML Evaluation Fault: {str(e)}")

# Add this endpoint to the bottom of backend/app/main.py

@app.post("/api/appointments/book", response_model=schemas.AppointmentBookingResponse)
def book_hospital_appointment(
    request: schemas.AppointmentBookingRequest, 
    db: Session = Depends(get_db)
):
    """
    Takes a patient's preferred scheduling window and runs our 
    scheduling_agent LangGraph workflow to assign an available physician.
    """
    try:
        # Construct the initial graph state for the Agent execution
        initial_state = {
            "patient_id": request.patient_id,
            "preferred_department": request.department,
            "preferred_date": request.preferred_date,
            "preferred_time": request.preferred_time,
            "doctor_id": None,
            "appointment_status": "pending",
            "summary": "",
            "db": db  # Pass the database session for internal queries
        }
        
        # REMOVED .compile() BECAUSE THE GRAPH IS ALREADY COMPILED! 👈
        final_state = scheduling_agent.invoke(initial_state)
        
        # Return the verified appointment results to the frontend.
        # The scheduling agent uses keys: `appointment_status`, `recommended_doctor_id`, and `agent_reasoning`.
        # Map those into the response shape expected by the frontend while keeping fallbacks
        return {
            "status": final_state.get("appointment_status", final_state.get("status", "failed")),
            "doctor_id": final_state.get("recommended_doctor_id", final_state.get("doctor_id")),
            "summary": final_state.get("agent_reasoning", final_state.get("summary", "No schedule slot could be verified."))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scheduling Engine Fault: {str(e)}")
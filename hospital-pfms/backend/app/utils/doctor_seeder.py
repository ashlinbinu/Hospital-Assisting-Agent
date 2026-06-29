from app.database import SessionLocal
import app.models as models
import datetime

DOCTOR_SEEDS = [
    {
        "name": "Dr. Emily Smith",
        "department": "General Medicine",
        "availability_start": datetime.time(8, 0),
        "availability_end": datetime.time(16, 0),
        "consultation_duration": 15,
        "is_active": True
    },
    {
        "name": "Dr. Michael Carter",
        "department": "Cardiology",
        "availability_start": datetime.time(9, 0),
        "availability_end": datetime.time(17, 0),
        "consultation_duration": 20,
        "is_active": True
    },
    {
        "name": "Dr. Priya Joshi",
        "department": "Pediatrics",
        "availability_start": datetime.time(8, 30),
        "availability_end": datetime.time(15, 30),
        "consultation_duration": 15,
        "is_active": True
    },
    {
        "name": "Dr. Amina Hassan",
        "department": "Neurology",
        "availability_start": datetime.time(10, 0),
        "availability_end": datetime.time(18, 0),
        "consultation_duration": 20,
        "is_active": True
    },
    {
        "name": "Dr. Luis Ramirez",
        "department": "Orthopedics",
        "availability_start": datetime.time(7, 30),
        "availability_end": datetime.time(15, 30),
        "consultation_duration": 25,
        "is_active": True
    },
    {
        "name": "Dr. Mei Lin",
        "department": "Emergency Medicine",
        "availability_start": datetime.time(0, 0),
        "availability_end": datetime.time(23, 59),
        "consultation_duration": 10,
        "is_active": True
    },
    {
        "name": "Dr. Noah Bennett",
        "department": "Dermatology",
        "availability_start": datetime.time(9, 0),
        "availability_end": datetime.time(14, 0),
        "consultation_duration": 20,
        "is_active": True
    },
    {
        "name": "Dr. Sophia Greene",
        "department": "Gynecology",
        "availability_start": datetime.time(10, 0),
        "availability_end": datetime.time(18, 0),
        "consultation_duration": 20,
        "is_active": True
    }
]


def seed_doctors():
    """Seed default doctors into the database if none exist."""
    db = SessionLocal()
    try:
        existing_count = db.query(models.Doctor).count()
        if existing_count > 0:
            return {
                "status": "skipped",
                "message": f"{existing_count} doctor(s) already exist; seed skipped."
            }

        doctor_rows = [
            models.Doctor(
                name=entry["name"],
                department=entry["department"],
                availability_start=entry["availability_start"],
                availability_end=entry["availability_end"],
                consultation_duration=entry["consultation_duration"],
                is_active=entry["is_active"]
            )
            for entry in DOCTOR_SEEDS
        ]

        db.add_all(doctor_rows)
        db.commit()
        return {
            "status": "success",
            "message": f"Seeded {len(doctor_rows)} doctor records into the database."
        }
    finally:
        db.close()


def get_doctors():
    """Return all active doctors with their departments and hours."""
    db = SessionLocal()
    try:
        doctors = db.query(models.Doctor).all()
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
    finally:
        db.close()

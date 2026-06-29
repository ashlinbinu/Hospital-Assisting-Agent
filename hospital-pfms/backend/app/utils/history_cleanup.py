from datetime import datetime, timedelta
from sqlalchemy import func
from app.database import SessionLocal
import app.models as models
import pandas as pd
import os
import joblib
from sklearn.ensemble import RandomForestRegressor

MODEL_NAME = 'model.pkl'

DEPT_MAP = {
    "General Medicine": 0,
    "Cardiology": 1,
    "Pediatrics": 2
}

REVERSE_DEPT_MAP = {v: k for k, v in DEPT_MAP.items()}


def archive_and_retrain_previous_day():
    """Archive yesterday's queue rows, delete them, and retrain the wait-time model."""
    db = SessionLocal()
    try:
        yesterday = datetime.utcnow().date() - timedelta(days=1)
        start_ts = datetime.combine(yesterday, datetime.min.time())
        end_ts = datetime.combine(yesterday, datetime.max.time())

        # Build dataset from yesterday's queue entries and doctor metadata
        rows = db.query(
            models.Queue,
            models.Doctor.department,
            models.Doctor.consultation_duration,
            models.Queue.checked_in_at
        ).join(models.Doctor, models.Queue.doctor_id == models.Doctor.id)
        rows = rows.filter(models.Queue.checked_in_at >= start_ts, models.Queue.checked_in_at <= end_ts).all()

        if not rows:
            print("No previous-day queue rows found for archival.")
            return

        # Derive a better queue length estimate from the maximum position per doctor.
        max_positions_by_doctor = {}
        for queue_row, _, _, _ in rows:
            current_max = max_positions_by_doctor.get(queue_row.doctor_id, 0)
            max_positions_by_doctor[queue_row.doctor_id] = max(current_max, queue_row.current_position)

        history_records = []
        for queue_row, department, consultation_duration, checked_in in rows:
            wait_time = queue_row.estimated_wait_time or (queue_row.current_position * consultation_duration)
            avg_duration = consultation_duration or 15
            dept_name = department if department in DEPT_MAP else "General Medicine"
            queue_length = max_positions_by_doctor.get(queue_row.doctor_id, queue_row.current_position)

            history_records.append({
                "queue_length": queue_length,
                "department": dept_name,
                "avg_duration": avg_duration,
                "wait_time": float(wait_time),
                "created_at": queue_row.checked_in_at
            })

            db.add(models.WaitHistory(
                queue_length=queue_length,
                department=dept_name,
                avg_duration=avg_duration,
                wait_time=float(wait_time),
                created_at=queue_row.checked_in_at
            ))

        db.commit()

        # Remove the original rows from the live queue table
        db.query(models.Queue).filter(models.Queue.checked_in_at >= start_ts, models.Queue.checked_in_at <= end_ts).delete(synchronize_session=False)
        db.commit()

        print(f"Archived {len(history_records)} queue row(s) from {yesterday} into wait_history.")

        # Retrain model from all historical wait history rows
        retrain_model_from_history(db)
    finally:
        db.close()


def retrain_model_from_history(db=None):
    local_session = False
    if db is None:
        db = SessionLocal()
        local_session = True

    try:
        rows = db.query(models.WaitHistory).all()
        if not rows:
            print("No wait history records available to train the model.")
            return

        df = pd.DataFrame([{
            "queue_length": r.queue_length,
            "dept": DEPT_MAP.get(r.department, 0),
            "avg_duration": r.avg_duration,
            "wait_time": r.wait_time
        } for r in rows])

        X = df[["queue_length", "dept", "avg_duration"]]
        y = df["wait_time"]

        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X, y)

        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model_path = os.path.join(current_dir, 'ml', MODEL_NAME)
        joblib.dump(model, model_path)
        print(f"Retrained and saved wait-time model to: {model_path}")
    finally:
        if local_session:
            db.close()


if __name__ == "__main__":
    archive_and_retrain_previous_day()

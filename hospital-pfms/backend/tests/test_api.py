import pytest
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_health_check():
    """Verify the core entrypoint responds successfully."""
    response = requests.get(f"{BASE_URL}/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_ml_prediction_endpoint():
    """Verify our Random Forest Regressor evaluates wait times correctly."""
    payload = {
        "queue_length": 5,
        "department": "Cardiology",
        "average_duration": 15
    }
    response = requests.get(f"{BASE_URL}/api/predictions/wait-time", params=payload)
    assert response.status_code == 200
    data = response.json()
    assert "estimated_wait_time_minutes" in data
    assert data["current_queue_length"] == 5

def test_analytics_report_endpoint():
    """Verify the database report generator calculates aggregate structures cleanly."""
    response = requests.get(f"{BASE_URL}/api/reports/daily")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "departmental_load" in data


def test_archive_previous_day_data_endpoint():
    """Verify previous-day queue archival and retraining maintenance endpoint."""
    response = requests.post(f"{BASE_URL}/api/maintenance/archive-previous-day")
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "success"
    assert "archived" in result["message"].lower()
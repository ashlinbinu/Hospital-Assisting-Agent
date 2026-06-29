import requests

BASE_URL = "http://127.0.0.1:8000"


def test_seed_doctors_endpoint():
    response = requests.post(f"{BASE_URL}/api/maintenance/seed-doctors")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in {"success", "skipped"}


def test_list_doctors_endpoint():
    response = requests.get(f"{BASE_URL}/api/doctors")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "department" in data[0]

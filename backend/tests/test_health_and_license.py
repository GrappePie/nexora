from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert data.get("ok") is True
    assert data.get("service") == "core"
    assert isinstance(data.get("version"), str) and len(data["version"]) > 0


def test_license_status_endpoint():
    r = client.get("/license/status")
    assert r.status_code == 200
    data = r.json()
    assert data.get("status") in {"valid", "limited", "expired"}
    assert data.get("status") == "valid"
    assert data.get("exp") is None


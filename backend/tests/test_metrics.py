from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_metrics_endpoint():
    r = client.get("/metrics")
    assert r.status_code == 200
    assert "text/plain" in r.headers.get("content-type", "")
    assert b"# HELP" in r.content

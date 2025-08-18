from fastapi.testclient import TestClient
from backend.app.main import app

if __name__ == "__main__":
    c = TestClient(app)
    r = c.get("/health")
    print("/health:", r.status_code, r.json())


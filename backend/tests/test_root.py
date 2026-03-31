from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_route():
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "Nere_app backend OK"
    assert "environment" in payload

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root_route():
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "Nere_app backend OK"
    assert "environment" in payload


def test_tables_route(admin_auth_header):
    response = client.get("/api/tables", headers=admin_auth_header)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert "tables" in payload
    assert isinstance(payload["tables"], list)


def test_users_table_access(admin_auth_header):
    response = client.get("/api/tables/users", headers=admin_auth_header)
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["table"] == "users"
    assert "rows" in payload
    assert isinstance(payload["rows"], list)

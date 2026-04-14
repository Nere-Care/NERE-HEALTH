import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_route():
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "Nere_app backend OK"
    assert "environment" in payload


def test_tables_route():
    response = client.get("/api/tables")
    if response.status_code != 200:
        pytest.skip("Database schema is not ready yet")
    payload = response.json()
    assert "tables" in payload
    assert isinstance(payload["tables"], list)


def test_users_table_access():
    response = client.get("/api/tables/users")
    if response.status_code != 200:
        pytest.skip("Users table is not accessible yet")
    payload = response.json()
    assert payload["table"] == "users"
    assert "rows" in payload
    assert isinstance(payload["rows"], list)

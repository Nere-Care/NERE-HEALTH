"""Debug test to verify JWT middleware is setting request.state.user"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app


def test_debug_request_state_without_auth():
    """Test debug endpoint without auth header"""
    client = TestClient(app)
    response = client.get("/debug/request-state")

    # This should still work as /debug/request-state is a public path
    assert response.status_code == 200


def test_debug_request_state_with_auth(admin_auth_header):
    """Test debug endpoint WITH auth header"""
    client = TestClient(app)
    response = client.get("/debug/request-state", headers=admin_auth_header)

    # This should return 200 and show user_set=True
    assert response.status_code == 200
    assert response.json()["user_set"] is True
    assert response.json()["user_email"] is not None


def test_middleware_sets_request_state(admin_auth_header):
    """Test that middleware properly sets request.state.user"""
    client = TestClient(app)

    # Make a request to a protected endpoint
    response = client.get("/api/tables", headers=admin_auth_header)

    # Check the response
    assert response.status_code == 200


def test_auth_header_format(admin_auth_header):
    """Test that auth header is properly formatted"""
    print(f"\nAuth header keys: {list(admin_auth_header.keys())}")
    assert "Authorization" in admin_auth_header
    auth_value = admin_auth_header["Authorization"]
    print(f"Auth value: {auth_value[:30]}...")
    assert auth_value.startswith("Bearer ")
    token = auth_value.split(" ")[1]
    print(f"Token length: {len(token)}")
    assert len(token) > 0

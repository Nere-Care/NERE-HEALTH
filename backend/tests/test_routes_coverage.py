import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

IGNORED_PATHS = {"/openapi.json", "/docs", "/redoc", "/favicon.ico"}


def normalize_path(path: str) -> str:
    return path.replace("{", "1").replace("}", "")


def is_documented_route(route) -> bool:
    return getattr(route, "include_in_schema", False) and route.path not in IGNORED_PATHS and not route.path.startswith("/static")


def backend_is_healthy() -> bool:
    response = client.get("/health")
    return response.status_code == 200


def test_all_routes_are_in_openapi():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()

    documented_paths = set(schema.get("paths", {}).keys())
    actual_route_paths = {route.path for route in app.routes if is_documented_route(route)}

    missing_paths = actual_route_paths - documented_paths
    assert not missing_paths, (
        "The following application routes are registered but missing from OpenAPI schema: "
        + ", ".join(sorted(missing_paths))
    )


def test_openapi_routes_return_valid_responses_when_backend_is_ready():
    if not backend_is_healthy():
        pytest.skip("Backend health check failed or database unavailable")

    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()

    accepted_status_codes = {200, 201, 202, 204, 400, 401, 403, 404, 405, 409, 422}

    for path, operations in schema.get("paths", {}).items():
        if path in IGNORED_PATHS or path.startswith("/docs") or path.startswith("/redoc"):
            continue

        test_path = normalize_path(path)
        for method in operations:
            if method == "parameters":
                continue
            response = client.request(method.upper(), test_path, json={})
            assert response.status_code in accepted_status_codes, (
                f"Route {method.upper()} {test_path} returned unexpected status "
                f"{response.status_code}: {response.text}"
            )

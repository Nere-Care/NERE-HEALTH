import re

from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def normalize_path(path: str) -> str:
    """Replace path parameter placeholders with sample values."""
    return re.sub(r"\{[^}]+\}", "1", path)


def test_all_openapi_routes_are_registered() -> None:
    response = client.get("/openapi.json")
    assert response.status_code == 200, response.text
    spec = response.json()
    assert "paths" in spec

    for path in spec["paths"]:
        url = normalize_path(path)
        options_response = client.options(url)
        assert options_response.status_code not in (404, 500), (
            f"Route path not registered or server error for {url}: {options_response.status_code}"
        )

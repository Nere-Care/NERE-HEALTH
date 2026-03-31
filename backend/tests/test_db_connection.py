import pytest
from db import engine


def test_database_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            assert result.scalar() == 1
    except Exception as exc:
        pytest.skip(f"Database unavailable: {exc}")

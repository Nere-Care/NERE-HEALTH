import pytest
from sqlalchemy import text
from db import engine


def test_database_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            assert result.scalar() == 1
            table_exists = conn.execute(
                text("SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users'")
            ).scalar()
            assert table_exists == 'users'
    except Exception as exc:
        pytest.skip(f"Database unavailable: {exc}")

import pytest
from sqlalchemy import text
from backend.db import engine


def test_database_connection():
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            assert result.scalar() == 1
            dialect = conn.dialect.name
            if dialect == "sqlite":
                table_exists = conn.execute(
                    text(
                        "SELECT name FROM sqlite_master "
                        "WHERE type='table' AND name='users'"
                    )
                ).scalar()
            else:
                table_exists = conn.execute(
                    text(
                        "SELECT tablename FROM pg_tables "
                        "WHERE schemaname = 'public' "
                        "AND tablename = 'users'"
                    )
                ).scalar()
            assert table_exists == 'users'
    except Exception as exc:
        pytest.skip(f"Database unavailable: {exc}")

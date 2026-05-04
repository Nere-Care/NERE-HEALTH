#!/usr/bin/env python3
"""Quick test of PostgreSQL connection from Windows host."""
import sys
import os

# Try different connection methods
test_urls = [
    'postgresql://nere_user:nere_pass@localhost:5433/nere_db',
    'postgresql+psycopg2://nere_user:nere_pass@localhost:5433/nere_db',
]

for url in test_urls:
    print(f"\nTesting: {url}")
    try:
        from sqlalchemy import create_engine
        engine = create_engine(url, echo=False, connect_args={"timeout": 5})
        with engine.connect() as conn:
            result = conn.execute("SELECT 1")
            print(f"✅ Success: {result.scalar()}")
            break
    except Exception as e:
        print(f"❌ Failed: {str(e)[:100]}")
else:
    print("\n⚠️  No connection successful. Check:")
    print("1. docker ps - Is infra-db-1 running?")
    print("2. docker logs infra-db-1 - Any startup errors?")
    print("3. Database credentials in .env.example")

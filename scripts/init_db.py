#!/usr/bin/env python3
"""
Initialize NERE_APP PostgreSQL Database for testing.
Creates schema, extensions, and initial data.
"""
import os
import sys
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Add backend to path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

def init_database():
    """Initialize PostgreSQL database with extensions and schema."""
    try:
        # Get database URL from environment
        db_url = os.getenv(
            'DATABASE_URL',
            'postgresql://nere_user:nere_pass@localhost:5433/nere_db'
        )

        print(f"📊 Initializing database...")
        print(f"   Database: {db_url.split('@')[1].split('/')[1] if '@' in db_url else 'unknown'}")

        # Create engine
        engine = create_engine(db_url, echo=False)

        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            conn.commit()

        # Enable required extensions
        extensions = [
            'uuid-ossp',
        ]

        with engine.connect() as conn:
            for ext in extensions:
                try:
                    conn.execute(text(f'CREATE EXTENSION IF NOT EXISTS "{ext}"'))
                    print(f"   ✅ Extension '{ext}' enabled")
                except Exception as e:
                    print(f"   ⚠️  Extension '{ext}' error: {e}")
            conn.commit()

        # Create schema version tracking table
        with engine.connect() as conn:
            conn.execute(text('''
                CREATE TABLE IF NOT EXISTS schema_version (
                    version_rank INTEGER,
                    installed_rank INTEGER,
                    version VARCHAR(50) NOT NULL,
                    description VARCHAR(255) NOT NULL,
                    type VARCHAR(20) NOT NULL,
                    script VARCHAR(1000) NOT NULL,
                    checksum INTEGER,
                    installed_by VARCHAR(100) NOT NULL,
                    installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    execution_time INTEGER NOT NULL,
                    success BOOLEAN NOT NULL
                )
            '''))
            print("   ✅ Schema version table created")
            conn.commit()

        print("\n🎉 Database initialization complete!")
        print("\nNext steps:")
        print("  1. Run migrations: alembic -c backend/alembic.ini upgrade head")
        print("  2. Run tests: pytest backend/tests/ -v")
        print("  3. Start server: uvicorn backend.main:app --reload")

        return True

    except SQLAlchemyError as e:
        error_msg = str(e).encode('utf-8', errors='ignore').decode('utf-8')
        print(f"\n❌ Database error: {error_msg}")
        print("\n🔧 Troubleshooting:")
        print("  1. Check PostgreSQL is running: docker ps")
        print("  2. Verify credentials in DATABASE_URL")
        print("  3. Check port: Default is 5433 for Docker Compose")
        print("  4. Restart DB: docker compose restart db")
        return False
    except Exception as e:
        error_msg = str(e).encode('utf-8', errors='ignore').decode('utf-8')
        print(f"\n❌ Unexpected error: {error_msg}")
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)

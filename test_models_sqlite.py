"""Test models.py compatibility with SQLite"""
import os
import sys

# Set environment BEFORE any imports from backend
os.environ['DATABASE_URL'] = 'sqlite:///./test_models_temp.db'
os.environ['ENVIRONMENT'] = 'testing'
os.environ['DEBUG'] = 'false'
os.environ['SECRET_KEY'] = 'test-key-' + 'x' * 56
os.environ['STRIPE_API_KEY'] = 'sk_test_fake'
os.environ['STRIPE_WEBHOOK_SECRET'] = 'whsec_test_fake'
os.environ['OPENAI_API_KEY'] = 'sk-test-fake'

# Now import backend modules
from backend.models import User, Patient, Consultation, Base
from sqlalchemy import create_engine

print("\n" + "="*60)
print("🧪 TESTING MODELS.PY WITH SQLITE")
print("="*60 + "\n")

# Create a fresh SQLite engine
db_url = 'sqlite:///./test_models_temp.db'
print(f"✅ Database URL: {db_url}")
print(f"✅ All imports successful")
print(f"✅ Models loaded: User, Patient, Consultation\n")

# Create new engine for SQLite
engine = create_engine(db_url, echo=False)

try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database schema created successfully with SQLite")

    # List created tables
    from sqlalchemy import inspect
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"✅ Tables created: {', '.join(tables)}\n")

except Exception as e:
    print(f"❌ Error creating schema: {type(e).__name__}: {e}\n")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("="*60)
print("✅ SQLITE COMPATIBILITY TEST PASSED")
print("="*60 + "\n")

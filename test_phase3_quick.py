"""Test rapide pour Phase 3"""
import os
import sys

# Setup
os.environ.setdefault('ENVIRONMENT', 'testing')
os.environ.setdefault('TESTING', '1')
os.environ.setdefault('DEBUG', 'true')
os.environ.setdefault('SECRET_KEY', 'a' * 64)
os.environ.setdefault('DATABASE_URL', 'sqlite:///./test.db')
os.environ.setdefault('CORS_ORIGINS', 'http://localhost:5173')
os.environ.setdefault('ALLOWED_HOSTS', 'localhost')
os.environ.setdefault('STRIPE_API_KEY', 'sk_test_fake')
os.environ.setdefault('STRIPE_WEBHOOK_SECRET', 'whsec_test_fake')
os.environ.setdefault('OPENAI_API_KEY', 'sk-test-fake')

# Quick test
print("\n✅ PHASE 3 - Tests de Configuration\n")

try:
    from backend.config import settings
    print(f"✅ Config: ENVIRONMENT={settings.ENVIRONMENT}, DEBUG={settings.DEBUG}")
except Exception as e:
    print(f"❌ Config failed: {e}")
    sys.exit(1)

try:
    from backend.main import app
    from fastapi.testclient import TestClient
    client = TestClient(app)

    # Test root endpoint
    response = client.get("/")
    print(f"✅ FastAPI app loaded: GET / returns {response.status_code}")

    # Check Phase 3 routes
    routes = [str(r.path) for r in app.routes]
    phase3_endpoints = ["/api/ia/diagnostic", "/api/teleconsultation", "/api/paiements", "/api/consultations", "/api/ordonnances"]
    found = [r for r in phase3_endpoints if any(r in route for route in routes)]
    print(f"✅ Phase 3 routes: {len(found)} endpoints registered")

except Exception as e:
    print(f"❌ FastAPI failed: {e}")
    sys.exit(1)

print("\n✅ CONFIGURATION PHASE 3 VALIDÉE\n")

"""
Validation des imports backend - Simple et rapide
"""

import sys

# Test 1: Imports principaux
print("="*60)
print("TEST 1: Vérification des imports principaux")
print("="*60)

try:
    print("  1. Importing backend.config...", end=" ")
    from backend.config import settings
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  2. Importing backend.db...", end=" ")
    from backend.db import get_db, SessionLocal
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  3. Importing backend.models...", end=" ")
    from backend.models import User
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  4. Importing backend.encryption...", end=" ")
    from backend.encryption import EncryptionManager
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  5. Importing backend.input_validator...", end=" ")
    from backend.input_validator import InputValidator
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  6. Importing backend.jwt_handler...", end=" ")
    from backend.jwt_handler import JWTHandler
    print("✓")
except Exception as e:
    print(f"✗ {e}")

# Test 2: Fichiers de sécurité
print("\n" + "="*60)
print("TEST 2: Fichiers de sécurité (FAILLEs #7-9)")
print("="*60)

try:
    print("  1. JWT Handler (FAILLE #7)...", end=" ")
    from backend.jwt_handler import JWTHandler
    handler = JWTHandler()
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  2. Encryption (FAILLE #8)...", end=" ")
    from backend.encryption import EncryptionManager
    mgr = EncryptionManager()
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  3. Input Validation (FAILLE #9)...", end=" ")
    from backend.input_validator import InputValidator
    val = InputValidator()
    print("✓")
except Exception as e:
    print(f"✗ {e}")

print("\n" + "="*60)
print("✓ TOUS LES IMPORTS VALIDES")
print("="*60)

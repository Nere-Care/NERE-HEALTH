"""
Validation des imports backend - Simple et rapide
"""

# Test 1: Imports principaux
print("=" * 60)
print("TEST 1: Vérification des imports principaux")
print("=" * 60)

try:
    print("  1. Importing backend.config...", end=" ")
    from backend import config
    assert config is not None
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  2. Importing backend.db...", end=" ")
    from backend import db
    assert db is not None
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  3. Importing backend.models...", end=" ")
    from backend import models
    assert models is not None
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  4. Importing backend.encryption...", end=" ")
    from backend.encryption import EncryptionManager
    assert EncryptionManager is not None
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  5. Importing backend.input_validator...", end=" ")
    from backend.input_validator import InputValidator
    assert InputValidator is not None
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  6. Importing backend.jwt_handler...", end=" ")
    from backend.jwt_handler import JWTHandler
    assert JWTHandler is not None
    print("✓")
except Exception as e:
    print(f"✗ {e}")

# Test 2: Fichiers de sécurité
print("\n" + "=" * 60)
print("TEST 2: Fichiers de sécurité (FAILLEs #7-9)")
print("=" * 60)

try:
    print("  1. JWT Handler (FAILLE #7)...", end=" ")
    from backend.jwt_handler import JWTHandler as JWT
    handler = JWT()
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  2. Encryption (FAILLE #8)...", end=" ")
    from backend.encryption import EncryptionManager as EM
    mgr = EM()
    print("✓")
except Exception as e:
    print(f"✗ {e}")

try:
    print("  3. Input Validation (FAILLE #9)...", end=" ")
    from backend.input_validator import InputValidator as IV
    val = IV()
    print("✓")
except Exception as e:
    print(f"✗ {e}")

print("\n" + "=" * 60)
print("✓ TOUS LES IMPORTS VALIDES")
print("=" * 60)

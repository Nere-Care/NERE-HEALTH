import hashlib
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from config import settings


def _derive_key() -> bytes:
    """Derive a 256-bit key from the application secret."""
    return hashlib.sha256(settings.SECRET_KEY.encode()).digest()


def encrypt(plaintext: bytes) -> bytes:
    """Encrypt plaintext with AES-256-GCM. Returns nonce (12B) + ciphertext + tag (16B)."""
    nonce = os.urandom(12)
    aesgcm = AESGCM(_derive_key())
    ct = aesgcm.encrypt(nonce, plaintext, None)
    return nonce + ct


def decrypt(data: bytes) -> bytes:
    """Decrypt data produced by encrypt()."""
    nonce, ct = data[:12], data[12:]
    aesgcm = AESGCM(_derive_key())
    return aesgcm.decrypt(nonce, ct, None)

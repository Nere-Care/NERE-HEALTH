"""
Input Validation Module - FAILLE #9: Input Validation & Sanitization

Validation et sanitization complets des entrées :
- Validation stricte via Pydantic avec règles métier
- Protection contre SQL injection
- Protection contre XSS (HTML escaping)
- Validation des fichiers uploadés
- Sanitization des champs texte
"""

import re
from typing import Optional, List
from html import escape
import mimetypes
import logging

from pydantic import BaseModel, validator, Field


logger = logging.getLogger(__name__)


# ============================================================================
# Constantes de validation
# ============================================================================

ALLOWED_MIME_TYPES = {
    # Documents
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
    # Feuilles de calcul
    "application/vnd.ms-excel": ".xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
    # Images
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

# Expressions régulières pour validation
EMAIL_REGEX = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
PHONE_REGEX = r"^\+?1?\d{9,15}$"  # Format international
URL_REGEX = r"^https://[^\s]+$"  # HTTPS required for security
IPV4_REGEX = r"^(\d{1,3}\.){3}\d{1,3}$"

# Patterns SQL injection courants
SQL_INJECTION_PATTERNS = [
    r"(;|\-\-|\/\*|\*\/|xp_|sp_|exec|execute|select|insert|update|delete|drop|create|alter)",
    r"(union|from|where|having|group|order|by)",
    r"('|\"|\||&&)",
]


# ============================================================================
# Utilitaires de validation
# ============================================================================

class InputValidator:
    """Validateur d'entrées utilisateur."""

    @staticmethod
    def sanitize_text(text: str, max_length: int = 1000) -> str:
        """
        Nettoie un texte : escape HTML, limite longueur, trim.

        Args:
            text: Texte à nettoyer
            max_length: Longueur maximale

        Returns:
            Texte nettoyé
        """
        if not text:
            return ""

        # Limiter la longueur
        text = text[:max_length]

        # Échapper les caractères HTML
        text = escape(text)

        # Supprimer les caractères de contrôle
        text = "".join(char for char in text if ord(char) >= 32 or char in '\n\r\t')

        # Trim
        text = text.strip()

        return text

    @staticmethod
    def check_sql_injection(text: str) -> bool:
        """
        Vérifie si le texte contient des patterns SQL injection.

        Args:
            text: Texte à vérifier

        Returns:
            True si injection détectée
        """
        if not text:
            return False

        text_lower = text.lower()

        # Vérifier chaque pattern
        for pattern in SQL_INJECTION_PATTERNS:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"SQL injection pattern detected: {text[:100]}")
                return True

        return False

    @staticmethod
    def check_xss(text: str) -> bool:
        """
        Vérifie si le texte contient des patterns XSS (Cross-Site Scripting).

        Args:
            text: Texte à vérifier

        Returns:
            True si XSS détecté
        """
        if not text:
            return False

        text_lower = text.lower()

        # Patterns XSS courants
        xss_patterns = [
            r"<script[^>]*>",
            r"</script>",
            r"<iframe[^>]*>",
            r"<embed[^>]*>",
            r"<object[^>]*>",
            r"on\w+\s*=",  # Détecte onload=, onclick=, onerror=, etc.
            r"javascript:",
            r"<svg[^>]*>",
            r"<img[^>]*on",
        ]

        for pattern in xss_patterns:
            if re.search(pattern, text_lower, re.IGNORECASE):
                logger.warning(f"XSS pattern detected: {text[:100]}")
                return True

        return False

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Nettoie un nom de fichier.

        Args:
            filename: Nom de fichier original

        Returns:
            Nom de fichier sécurisé
        """
        if not filename:
            return "file"

        # Supprimer les chemins (../, etc.)
        filename = filename.replace("../", "").replace("..\\", "")

        # Supprimer les caractères spéciaux
        filename = re.sub(r"[^\w\s.-]", "", filename)

        # Limiter la longueur
        if len(filename) > 255:
            name, ext = filename.rsplit(".", 1) if "." in filename else (filename, "")
            filename = name[:240] + ("." + ext if ext else "")

        return filename or "file"

    @staticmethod
    def validate_file(
        file_content: bytes,
        filename: str,
        mime_type: str,
        max_size: int = MAX_FILE_SIZE,
    ) -> tuple[bool, str]:
        """
        Valide un fichier uploadé.

        Args:
            file_content: Contenu du fichier
            filename: Nom du fichier
            mime_type: Type MIME
            max_size: Taille maximale en bytes

        Returns:
            Tuple (is_valid, error_message)
        """
        # Vérifier la taille
        if len(file_content) > max_size:
            return False, f"File too large (max {max_size / 1024 / 1024:.1f}MB)"

        # Vérifier le type MIME
        if mime_type not in ALLOWED_MIME_TYPES:
            allowed = ", ".join(ALLOWED_MIME_TYPES.keys())
            return False, f"Unsupported file type. Allowed: {allowed}"

        # Vérifier l'extension
        if "." in filename:
            extension = "." + filename.rsplit(".", 1)[1].lower()
            expected_extension = ALLOWED_MIME_TYPES[mime_type]
            if extension != expected_extension:
                return False, f"File extension mismatch (expected {expected_extension})"

        # Vérifier que le fichier n'est pas vide
        if len(file_content) == 0:
            return False, "Empty file"

        return True, ""

    @staticmethod
    def validate_file_upload(file_obj) -> bool:
        """
        Valide un objet fichier uploadé (e.g., UploadFile de FastAPI).

        Args:
            file_obj: Objet fichier avec attributs filename, content_type, size

        Returns:
            True si valide, False sinon
        """
        if not file_obj:
            return False

        try:
            # Vérifier les attributs requis
            filename = getattr(file_obj, 'filename', None)
            content_type = getattr(file_obj, 'content_type', None)
            size = getattr(file_obj, 'size', 0)

            if not filename or not content_type:
                return False

            # Vérifier la taille
            if size == 0 or size > MAX_FILE_SIZE:
                return False

            # Vérifier le type MIME
            if content_type not in ALLOWED_MIME_TYPES:
                return False

            # Vérifier l'extension correspond au MIME type
            if "." in filename:
                extension = "." + filename.rsplit(".", 1)[1].lower()
                expected_extension = ALLOWED_MIME_TYPES[content_type]
                if extension != expected_extension:
                    return False

            return True
        except Exception as e:
            logger.error(f"File upload validation error: {str(e)}")
            return False

    @staticmethod
    def validate_email(email: str) -> bool:
        """Valide une adresse email."""
        if not email or len(email) > 255:
            return False
        return re.match(EMAIL_REGEX, email) is not None

    @staticmethod
    def validate_phone(phone: str) -> bool:
        """Valide un numéro de téléphone."""
        if not phone:
            return False
        # Supprimer les espaces et tirets
        phone_clean = re.sub(r"[\s-]", "", phone)
        return re.match(PHONE_REGEX, phone_clean) is not None

    @staticmethod
    def validate_url(url: str) -> bool:
        """Valide une URL."""
        if not url:
            return False
        return re.match(URL_REGEX, url) is not None


# ============================================================================
# Schemas Pydantic avec validation
# ============================================================================

class UserCreateSchema(BaseModel):
    """Schema de création utilisateur avec validation."""

    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=8, max_length=128)
    nom: str = Field(..., min_length=2, max_length=100)
    prenom: str = Field(..., min_length=2, max_length=100)
    telephone: Optional[str] = Field(None, max_length=20)

    @validator('email')
    def validate_email(cls, v):
        """Valide l'email et nettoie."""
        v = v.strip().lower()
        if not InputValidator.validate_email(v):
            raise ValueError("Email invalide")
        if InputValidator.check_sql_injection(v):
            raise ValueError("Caractères non autorisés dans email")
        return v

    @validator('password')
    def validate_password(cls, v):
        """Valide le mot de passe."""
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")

        # Vérifier la complexité
        has_upper = any(c.isupper() for c in v)
        has_lower = any(c.islower() for c in v)
        has_digit = any(c.isdigit() for c in v)
        has_special = any(c in "!@#$%^&*()-_=+[]{}|;:,.<>?" for c in v)

        if not (has_upper and has_lower and has_digit):
            raise ValueError(
                "Password must contain uppercase, lowercase, and digits"
            )

        return v

    @validator('nom', 'prenom')
    def validate_name_fields(cls, v):
        """Valide les champs nom/prénom."""
        if InputValidator.check_sql_injection(v):
            raise ValueError("Caractères non autorisés")
        v = InputValidator.sanitize_text(v, max_length=100)
        return v

    @validator('telephone')
    def validate_telephone(cls, v):
        """Valide le téléphone."""
        if v is None:
            return v
        if not InputValidator.validate_phone(v):
            raise ValueError("Numéro de téléphone invalide")
        return v


class ConsultationCreateSchema(BaseModel):
    """Schema de création consultation."""

    titre: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=5000)
    type_consultation: str = Field(...)
    specialite: str = Field(...)

    @validator('titre', 'type_consultation', 'specialite')
    def validate_text_fields(cls, v):
        """Valide les champs texte."""
        if InputValidator.check_sql_injection(v):
            raise ValueError("Caractères non autorisés")
        return InputValidator.sanitize_text(v)

    @validator('description')
    def validate_description(cls, v):
        """Valide la description."""
        if InputValidator.check_sql_injection(v):
            raise ValueError("Caractères non autorisés")
        return InputValidator.sanitize_text(v, max_length=5000)


class OrdonnanceCreateSchema(BaseModel):
    """Schema de création ordonnance."""

    numero_ordonnance: str = Field(..., max_length=50)
    medicaments: List[str] = Field(..., min_items=1, max_items=50)
    dosage: Optional[str] = Field(None, max_length=500)
    duree_traitement: Optional[str] = Field(None, max_length=100)

    @validator('numero_ordonnance', 'dosage', 'duree_traitement')
    def validate_text(cls, v):
        """Valide les champs texte."""
        if v is None:
            return v
        if InputValidator.check_sql_injection(v):
            raise ValueError("Caractères non autorisés")
        return InputValidator.sanitize_text(v)

    @validator('medicaments')
    def validate_medicaments(cls, v):
        """Valide la liste de médicaments."""
        validated = []
        for med in v:
            if InputValidator.check_sql_injection(med):
                raise ValueError(f"Caractères non autorisés: {med}")
            clean_med = InputValidator.sanitize_text(med, max_length=200)
            validated.append(clean_med)
        return validated


class PaiementCreateSchema(BaseModel):
    """Schema de création paiement."""

    montant: float = Field(..., gt=0, le=999999.99)
    devise: str = Field(default="EUR", pattern="^[A-Z]{3}$")
    description: Optional[str] = Field(None, max_length=500)
    reference: str = Field(..., max_length=100)

    @validator('description', 'reference')
    def validate_text(cls, v):
        """Valide les champs texte."""
        if v is None:
            return v
        if InputValidator.check_sql_injection(v):
            raise ValueError("Caractères non autorisés")
        return InputValidator.sanitize_text(v)

    @validator('devise')
    def validate_currency(cls, v):
        """Valide la devise."""
        allowed_currencies = ["EUR", "USD", "GBP", "CHF"]
        if v not in allowed_currencies:
            raise ValueError(f"Unsupported currency: {v}")
        return v


class FileUploadSchema(BaseModel):
    """Schema pour upload de fichier."""

    filename: str = Field(..., max_length=255)
    mime_type: str = Field(...)
    file_size: int = Field(..., gt=0, le=MAX_FILE_SIZE)

    @validator('filename')
    def validate_filename(cls, v):
        """Nettoie et valide le nom de fichier."""
        v = InputValidator.sanitize_filename(v)
        if not v:
            raise ValueError("Invalid filename")
        return v

    @validator('mime_type')
    def validate_mime_type(cls, v):
        """Valide le type MIME."""
        if v not in ALLOWED_MIME_TYPES:
            allowed = ", ".join(ALLOWED_MIME_TYPES.keys())
            raise ValueError(f"Unsupported MIME type. Allowed: {allowed}")
        return v


# ============================================================================
# Middleware de validation
# ============================================================================

from fastapi import HTTPException, status, Request


class InputValidationMiddleware:
    """
    Middleware pour valider tous les inputs reçus.

    Peut être utilisée pour valider:
    - Les paramètres de requête
    - Les headers
    - Les champs JSON/formulaire
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope, receive)

        # Valider les headers sensibles
        headers_to_check = [
            "X-Forwarded-For",
            "X-Real-IP",
            "User-Agent",
            "Referer",
        ]

        for header_name in headers_to_check:
            header_value = request.headers.get(header_name)
            if header_value and InputValidator.check_sql_injection(header_value):
                logger.warning(
                    f"SQL injection attempt in header {header_name}: {header_value[:100]}"
                )
                response = Response(
                    content="Invalid input",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
                await response(scope, receive, send)
                return

        # Continuer
        await self.app(scope, receive, send)

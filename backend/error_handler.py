"""
Secure Error Handling and Response System (FAILLE #6)
Prevents sensitive information leakage through error messages.
"""

import logging
from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from .audit_logger import get_audit_logger
from .db import SessionLocal

logger = logging.getLogger(__name__)

# Mapping of error codes to user-friendly messages
ERROR_MESSAGES = {
    status.HTTP_400_BAD_REQUEST: "Données invalides. Veuillez vérifier votre entrée.",
    status.HTTP_401_UNAUTHORIZED: "Authentification échouée. Veuillez vérifier vos identifiants.",
    status.HTTP_403_FORBIDDEN: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
    status.HTTP_404_NOT_FOUND: "Ressource non trouvée.",
    status.HTTP_409_CONFLICT: "Conflit lors du traitement de votre demande.",
    status.HTTP_429_TOO_MANY_REQUESTS: "Trop de requêtes. Veuillez réessayer plus tard.",
    status.HTTP_500_INTERNAL_SERVER_ERROR: "Erreur serveur. Veuillez réessayer plus tard.",
    status.HTTP_503_SERVICE_UNAVAILABLE: "Service temporairement indisponible.",
}


class SecureErrorResponse:
    """Secure error response generator that hides sensitive information."""

    @staticmethod
    def get_error_response(
        status_code: int,
        error_id: str,
        internal_message: str = None,
        user_message: str = None,
        request_id: str = None,
    ) -> Dict[str, Any]:
        """
        Generate a secure error response.

        Args:
            status_code: HTTP status code
            error_id: Unique error identifier for tracking
            internal_message: Internal error message (logged, not shown to user)
            user_message: User-friendly message (optional override)
            request_id: Request tracking ID

        Returns:
            Dictionary with safe error information
        """
        # Use provided user message or lookup from mapping
        message = user_message or ERROR_MESSAGES.get(status_code, "Une erreur s'est produite. Veuillez réessayer.")

        # Log internal message for debugging
        if internal_message:
            logger.warning(f"Error {error_id}: {internal_message}")

        return {
            "error": True,
            "status_code": status_code,
            "message": message,
            "error_id": error_id,
            "request_id": request_id,
        }


class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for secure error handling and logging.
    Catches exceptions and returns safe error responses.
    """

    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)

            # Log error responses
            if response.status_code >= 400:
                db = SessionLocal()
                try:
                    audit_logger = get_audit_logger(db)
                    audit_logger.log_action(
                        action="operation_echouee",
                        request=request,
                        additional_data={
                            "status_code": response.status_code,
                        },
                    )
                finally:
                    db.close()

            return response

        except StarletteHTTPException as e:
            # Handle FastAPI HTTPException
            return await self._handle_http_exception(request, e)

        except ValueError as e:
            # Handle validation errors
            return await self._handle_validation_error(request, e)

        except PermissionError as e:
            # Handle permission errors
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content=SecureErrorResponse.get_error_response(
                    status_code=status.HTTP_403_FORBIDDEN,
                    error_id=self._generate_error_id(),
                    internal_message=str(e),
                    request_id=getattr(request.state, "request_id", None),
                ),
            )

        except KeyError as e:
            # Handle missing keys (don't reveal the key name)
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content=SecureErrorResponse.get_error_response(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    error_id=self._generate_error_id(),
                    internal_message=f"Missing required field: {str(e)}",
                    request_id=getattr(request.state, "request_id", None),
                ),
            )

        except Exception as e:
            # Generic exception handler
            return await self._handle_generic_exception(request, e)

    async def _handle_http_exception(self, request: Request, exc: StarletteHTTPException) -> JSONResponse:
        """Handle HTTPException from FastAPI."""
        return JSONResponse(
            status_code=exc.status_code,
            content=SecureErrorResponse.get_error_response(
                status_code=exc.status_code,
                error_id=self._generate_error_id(),
                user_message=exc.detail if isinstance(exc.detail, str) else None,
                internal_message=str(exc),
                request_id=getattr(request.state, "request_id", None),
            ),
        )

    async def _handle_validation_error(self, request: Request, exc: ValueError) -> JSONResponse:
        """Handle validation errors."""
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=SecureErrorResponse.get_error_response(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                error_id=self._generate_error_id(),
                user_message="Les données fournies sont invalides.",
                internal_message=str(exc),
                request_id=getattr(request.state, "request_id", None),
            ),
        )

    async def _handle_generic_exception(self, request: Request, exc: Exception) -> JSONResponse:
        """Handle generic exceptions."""
        error_id = self._generate_error_id()

        # Log the full error for debugging
        logger.exception(f"Unhandled exception [{error_id}]: {str(exc)}")

        # Log to audit system if DB available
        db = SessionLocal()
        try:
            audit_logger = get_audit_logger(db)
            audit_logger.log_action(
                action="erreur_systeme",
                request=request,
                additional_data={
                    "error_id": error_id,
                    "error_type": type(exc).__name__,
                },
            )
        except Exception as log_exc:
            logger.error(f"Failed to log error: {log_exc}")
        finally:
            db.close()

        # Return safe error response to user
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=SecureErrorResponse.get_error_response(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                error_id=error_id,
                user_message="Erreur serveur. Veuillez contacter le support avec l'ID: " + error_id,
                request_id=getattr(request.state, "request_id", None),
            ),
        )

    @staticmethod
    def _generate_error_id() -> str:
        """Generate a unique error ID for tracking."""
        import uuid

        return f"ERR-{str(uuid.uuid4())[:8].upper()}"


class ValidationErrorHandler:
    """Utility class for handling validation errors securely."""

    @staticmethod
    def format_validation_error(errors: list) -> str:
        """Format validation errors without revealing internal structure."""
        if not errors:
            return "Données invalides."

        # Count errors by location
        error_count = len(errors)
        locations = set()

        for error in errors:
            if isinstance(error, dict):
                loc = error.get("loc", ["Unknown"])
                if loc and len(loc) > 1:
                    locations.add(loc[1])  # Get field name

        if locations:
            fields = ", ".join(sorted(locations))
            return f"Erreur de validation dans les champs: {fields}"

        return f"{error_count} erreur(s) de validation trouvée(s)."

    @staticmethod
    def sanitize_error_message(message: str) -> str:
        """Remove sensitive information from error messages."""
        # Remove database connection strings
        sensitive_patterns = [
            r"postgresql://[^@]*@[^/]*/",
            r"mysql://[^@]*@[^/]*/",
            r"password\s*[=:]\s*\S+",
            r"secret\s*[=:]\s*\S+",
            r"api[_-]?key\s*[=:]\s*\S+",
            r"token\s*[=:]\s*\S+",
        ]

        import re

        sanitized = message
        for pattern in sensitive_patterns:
            sanitized = re.sub(pattern, "[REDACTED]", sanitized, flags=re.IGNORECASE)

        return sanitized


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Add request IDs for error tracking and debugging."""

    async def dispatch(self, request: Request, call_next):
        import uuid

        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Add to response headers for client tracking
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        return response


# Secure exception classes
class SecureException(Exception):
    """Base exception for secure error handling."""

    def __init__(
        self,
        user_message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        internal_message: str = None,
        error_code: str = None,
    ):
        self.user_message = user_message
        self.status_code = status_code
        self.internal_message = internal_message or user_message
        self.error_code = error_code or "ERR_UNKNOWN"
        super().__init__(self.user_message)


class ValidationException(SecureException):
    """Exception for validation errors."""

    def __init__(self, message: str, field: str = None):
        super().__init__(
            user_message=message, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, error_code="ERR_VALIDATION"
        )
        self.field = field


class AuthenticationException(SecureException):
    """Exception for authentication errors."""

    def __init__(self, message: str = "Authentification échouée"):
        super().__init__(user_message=message, status_code=status.HTTP_401_UNAUTHORIZED, error_code="ERR_AUTH")


class AuthorizationException(SecureException):
    """Exception for authorization errors."""

    def __init__(self, message: str = "Accès refusé"):
        super().__init__(user_message=message, status_code=status.HTTP_403_FORBIDDEN, error_code="ERR_AUTHZ")


class RateLimitException(SecureException):
    """Exception for rate limiting."""

    def __init__(self, retry_after: int = 60):
        super().__init__(
            user_message=f"Trop de requêtes. Veuillez réessayer dans {retry_after} secondes.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="ERR_RATE_LIMIT",
        )
        self.retry_after = retry_after


class ResourceNotFoundException(SecureException):
    """Exception for missing resources."""

    def __init__(self, resource_type: str = "Ressource"):
        super().__init__(
            user_message=f"{resource_type} non trouvée",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="ERR_NOT_FOUND",
        )


def create_error_response(exc: SecureException, request_id: str = None) -> Dict[str, Any]:
    """Create a standardized error response from SecureException."""
    return SecureErrorResponse.get_error_response(
        status_code=exc.status_code,
        error_id=exc.error_code,
        internal_message=exc.internal_message,
        user_message=exc.user_message,
        request_id=request_id,
    )

"""
Audit Middleware for automatic logging of critical operations.
"""

import uuid
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session

from .audit_logger import get_audit_logger
from .db import SessionLocal


class AuditMiddleware(BaseHTTPMiddleware):
    """
    Middleware that automatically logs critical operations to audit trail.
    Critical paths are logged with full details including IP, user agent, etc.
    """

    def __init__(self, app: Callable, exclude_paths: list = None):
        super().__init__(app)
        self.exclude_paths = exclude_paths or [
            "/docs", "/redoc", "/openapi.json",
            "/favicon.ico", "/health", "/metrics",
            "/static"
        ]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for excluded paths
        if any(path in request.url.path for path in self.exclude_paths):
            return await call_next(request)

        # Get database session
        db: Session = SessionLocal()

        try:
            # Determine if this is a critical operation that needs logging
            if self._is_critical_operation(request):
                await self._log_operation(request, db)

            # Process the request
            response = await call_next(request)

            # Log response status for critical operations
            if self._is_critical_operation(request):
                await self._log_response(request, response, db)

            return response

        except Exception as e:
            # Log the error but don't break the request
            try:
                audit_logger = get_audit_logger(db)
                audit_logger.log_action(
                    action="erreur_systeme",
                    request=request,
                    additional_data={"error": str(e), "error_type": type(e).__name__}
                )
            except Exception:
                pass
            raise
        finally:
            try:
                db.close()
            except Exception:
                pass

    def _is_critical_operation(self, request: Request) -> bool:
        """Determine if the operation should be logged"""
        critical_paths = [
            "/auth/login",
            "/auth/logout",
            "/auth/register",
            "/auth/refresh",
            "/paiements",
            "/consultations",
            "/ordonnances",
            "/dossiers-medicaux",
            "/dossiers_medicaux",
            "/teleconsultation",
            "/ia/diagnostic",
            "/users",
            "/admin",
            "/audit",
            "/documents_medicaux",
            "/medecins",
            "/sessions"
        ]

        # Check if path matches critical operations
        path = request.url.path.lower()
        return any(critical in path for critical in critical_paths)

    async def _log_operation(self, request: Request, db: Session):
        """Log the operation details"""
        audit_logger = get_audit_logger(db)

        # Determine action type based on HTTP method and path
        action = self._determine_action(request)

        # Extract entity information if applicable
        entity_type, entity_id = self._extract_entity_info(request)

        # Get user info from request state if available
        user_id = getattr(request.state, "user_id", None)
        user_role = getattr(request.state, "user_role", None)
        session_id = getattr(request.state, "session_id", None)

        audit_logger.log_action(
            action=action,
            utilisateur_id=user_id,
            role_utilisateur=user_role,
            session_id=session_id,
            entite_type=entity_type,
            entite_id=entity_id,
            request=request
        )

    async def _log_response(self, request: Request, response: Response, db: Session):
        """Log response details for critical operations"""
        # Only log errors or important status codes
        if response.status_code >= 400:
            audit_logger = get_audit_logger(db)

            # Get user info from request state if available
            user_id = getattr(request.state, "user_id", None)
            user_role = getattr(request.state, "user_role", None)
            session_id = getattr(request.state, "session_id", None)

            audit_logger.log_action(
                action="operation_echouee",
                utilisateur_id=user_id,
                role_utilisateur=user_role,
                session_id=session_id,
                request=request,
                additional_data={
                    "status_code": response.status_code,
                    "reason": response.reason if hasattr(response, 'reason') else None
                }
            )

    def _determine_action(self, request: Request) -> str:
        """Determine the audit action based on HTTP method and path"""
        method = request.method
        path = request.url.path.lower()

        # Authentication actions
        if "/auth/login" in path:
            return "tentative_connexion"
        elif "/auth/logout" in path:
            return "deconnexion"
        elif "/auth/register" in path:
            return "creation_compte"
        elif "/auth/refresh" in path:
            return "renouvellement_session"

        # Payment actions
        elif "/paiements" in path:
            if method == "POST":
                return "paiement_initie"
            elif method in ["PUT", "PATCH"]:
                return "paiement_confirme"
            elif method == "GET":
                return "lecture"

        # Medical data access
        elif "/dossiers-medicaux" in path or "/dossiers_medicaux" in path:
            if method == "GET":
                return "acces_dossier_medical"
            elif method in ["POST", "PUT", "PATCH"]:
                return "modification"
            elif method == "DELETE":
                return "suppression"

        # Ordonnance management
        elif "/ordonnances" in path:
            if method == "POST":
                return "creation"
            elif method in ["PUT", "PATCH"]:
                return "modification"
            elif method == "GET":
                return "lecture"
            elif method == "DELETE":
                return "suppression"

        # Consultation management
        elif "/consultations" in path:
            if method == "POST":
                return "creation"
            elif method in ["PUT", "PATCH"]:
                return "modification"
            elif method == "GET":
                return "lecture"
            elif method == "DELETE":
                return "suppression"

        # Teleconsultation
        elif "/teleconsultation" in path:
            if "prepare" in path:
                return "teleconsultation_debut"
            elif "signal" in path:
                return "teleconsultation_signal"
            elif method == "GET":
                return "teleconsultation_lecture"

        # AI diagnostics
        elif "/ia/diagnostic" in path:
            if method == "POST":
                return "ia_diagnostic_creation"
            elif method == "GET":
                return "ia_diagnostic_lecture"

        # Admin actions
        elif "/admin" in path:
            if method == "GET":
                return "lecture"
            elif method == "POST":
                return "creation"
            elif method in ["PUT", "PATCH"]:
                return "modification"
            elif method == "DELETE":
                return "suppression"

        # Documents
        elif "/documents_medicaux" in path:
            if method == "POST":
                return "upload_document"
            elif method == "DELETE":
                return "suppression"
            elif method == "GET":
                return "lecture"

        # User management
        elif "/users" in path:
            if method == "GET":
                return "lecture"
            elif method in ["PUT", "PATCH"]:
                return "modification"
            elif method == "DELETE":
                return "suppression"

        # Default actions based on HTTP method
        if method == "POST":
            return "creation"
        elif method in ["PUT", "PATCH"]:
            return "modification"
        elif method == "DELETE":
            return "suppression"
        elif method == "GET":
            return "lecture"
        else:
            return "autre_operation"

    def _extract_entity_info(self, request: Request) -> tuple:
        """Extract entity type and ID from request path"""
        path = request.url.path.lower()
        path_parts = path.split("/")

        # Try to find UUID pattern (entity ID) in path
        entity_id = None
        entity_type = None

        # Common patterns
        if "/dossiers-medicaux" in path or "/dossiers_medicaux" in path:
            entity_type = "dossier_medical"
            # Usually the ID is after the entity type
            if len(path_parts) > 3:
                try:
                    entity_id = uuid.UUID(path_parts[-1])
                except (ValueError, IndexError):
                    pass

        elif "/consultations" in path:
            entity_type = "consultation"
            if len(path_parts) > 2:
                try:
                    entity_id = uuid.UUID(path_parts[-1])
                except (ValueError, IndexError):
                    pass

        elif "/ordonnances" in path:
            entity_type = "ordonnance"
            if len(path_parts) > 2:
                try:
                    entity_id = uuid.UUID(path_parts[-1])
                except (ValueError, IndexError):
                    pass

        elif "/paiements" in path:
            entity_type = "payment"
            if len(path_parts) > 2:
                try:
                    entity_id = uuid.UUID(path_parts[-1])
                except (ValueError, IndexError):
                    pass

        elif "/teleconsultation" in path:
            entity_type = "teleconsultation"
            if len(path_parts) > 2:
                try:
                    entity_id = uuid.UUID(path_parts[-1])
                except (ValueError, IndexError):
                    pass

        elif "/documents_medicaux" in path:
            entity_type = "document"
            if len(path_parts) > 2:
                try:
                    entity_id = uuid.UUID(path_parts[-1])
                except (ValueError, IndexError):
                    pass

        return entity_type, entity_id

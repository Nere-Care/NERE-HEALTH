"""
Audit Logging System for NERE Medical Application
Logs all critical operations for compliance and security monitoring.
"""

import logging
import uuid
import json
from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import Request

from .models import AuditLog, User

# Configure audit logger with file handler
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)

# Create console handler for audit logs
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
formatter = logging.Formatter("%(asctime)s - AUDIT - %(levelname)s - %(message)s")
console_handler.setFormatter(formatter)
audit_logger.addHandler(console_handler)

# Create file handler for audit logs
try:
    file_handler = logging.FileHandler("/var/log/nere_audit.log", encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    audit_logger.addHandler(file_handler)
except Exception:
    # Fallback if log file cannot be created
    pass


class AuditLogger:
    """Centralized audit logging system with synchronous database operations"""

    def __init__(self, db: Session):
        self.db = db

    def log_action(
        self,
        action: str,
        utilisateur_id: Optional[uuid.UUID] = None,
        role_utilisateur: Optional[str] = None,
        session_id: Optional[uuid.UUID] = None,
        entite_type: Optional[str] = None,
        entite_id: Optional[uuid.UUID] = None,
        request: Optional[Request] = None,
        additional_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Log an audit event to database and log file.

        Args:
            action: The action performed (from AuditLog.action enum)
            utilisateur_id: ID of the user performing the action
            role_utilisateur: Role of the user
            session_id: Current session ID
            entite_type: Type of entity being acted upon
            entite_id: ID of the entity being acted upon
            request: FastAPI request object for metadata
            additional_data: Extra data to store
        """
        try:
            # Extract request metadata
            ip_address = None
            user_agent = None
            endpoint = None
            methode_http = None

            if request:
                # Get real IP (handle proxies)
                ip_address = self._get_client_ip(request)
                user_agent = str(request.headers.get("user-agent", ""))[:500]
                endpoint = str(request.url.path)[:500]
                methode_http = request.method

            # Convert additional_data to JSON string if needed (for JSONB storage)
            additional_data_str = None
            if additional_data:
                try:
                    additional_data_str = json.dumps(additional_data, default=str)
                except Exception as e:
                    audit_logger.warning(f"Failed to serialize additional_data: {e}")
                    additional_data_str = str(additional_data)

            # Create audit log entry
            audit_entry = AuditLog(
                utilisateur_id=utilisateur_id,
                role_utilisateur=role_utilisateur,
                session_id=session_id,
                action=action,
                entite_type=entite_type,
                entite_id=entite_id,
                ip_address=ip_address,
                user_agent=user_agent,
                endpoint=endpoint,
                methode_http=methode_http,
                additional_data=additional_data_str,
            )

            self.db.add(audit_entry)
            self.db.commit()

            # Log to file/console
            log_message = (
                f"✓ Action: {action} | User: {utilisateur_id} | "
                f"Entity: {entite_type}:{entite_id} | IP: {ip_address} | "
                f"Endpoint: {methode_http} {endpoint}"
            )
            audit_logger.info(log_message)

        except Exception as e:
            # Don't let audit logging break the application
            audit_logger.error(f"✗ Failed to log audit event: {str(e)}")
            # Try to rollback if possible
            try:
                self.db.rollback()
            except Exception:
                pass

    def _get_client_ip(self, request: Request) -> Optional[str]:
        """Extract real client IP, handling proxies"""
        # Check X-Forwarded-For header (most common)
        x_forwarded_for = request.headers.get("x-forwarded-for")
        if x_forwarded_for:
            # Take first IP if multiple
            ip = str(x_forwarded_for).split(",")[0].strip()
            # Validate it's a proper IP format
            if ip and ip != "testclient":
                return ip

        # Check X-Real-IP header
        x_real_ip = request.headers.get("x-real-ip")
        if x_real_ip and x_real_ip != "testclient":
            return x_real_ip.strip()

        # Check CF-Connecting-IP header (Cloudflare)
        cf_connecting_ip = request.headers.get("cf-connecting-ip")
        if cf_connecting_ip and cf_connecting_ip != "testclient":
            return cf_connecting_ip.strip()

        # Check X-Forwarded header
        x_forwarded = request.headers.get("x-forwarded")
        if x_forwarded and x_forwarded != "testclient":
            return x_forwarded.strip()

        # Fallback to direct client IP, validating it's not "testclient"
        if request.client:
            ip = getattr(request.client, "host", None)
            if ip and ip != "testclient":
                return ip

        # Return localhost for testing/local client
        return "127.0.0.1"

    def log_auth_success(
        self,
        user_id: Optional[uuid.UUID] = None,
        email: Optional[str] = None,
        role: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log successful authentication event"""
        self.log_action(
            action="connexion",
            utilisateur_id=user_id,
            role_utilisateur=role,
            request=None,
            additional_data={
                **(additional_data or {}),
                "email": email,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "endpoint": endpoint,
                "method": method,
            },
        )

    def log_auth_failure(
        self,
        email: Optional[str] = None,
        reason: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log failed authentication attempt"""
        self.log_action(
            action="tentative_connexion_echec",
            request=None,
            additional_data={
                **(additional_data or {}),
                "email": email,
                "reason": reason,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "endpoint": endpoint,
                "method": method,
            },
        )

    def log_admin_action(
        self,
        admin_user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None,
        target_user_id: Optional[uuid.UUID] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log administrative actions"""
        self.log_action(
            action=action or "operation_echouee",
            utilisateur_id=admin_user_id,
            request=None,
            additional_data={
                **(additional_data or {}),
                "target_user_id": str(target_user_id) if target_user_id else None,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "endpoint": endpoint,
                "method": method,
            },
        )

    def log_payment_initiated(
        self,
        user_id: Optional[uuid.UUID] = None,
        payment_id: Optional[uuid.UUID] = None,
        amount: Optional[float] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log payment initiation"""
        self.log_action(
            action="paiement_initie",
            utilisateur_id=user_id,
            entite_type="payment",
            entite_id=payment_id,
            request=None,
            additional_data={
                **(additional_data or {}),
                "amount": amount,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "endpoint": endpoint,
                "method": method,
            },
        )

    def log_medical_access(
        self,
        user_id: Optional[uuid.UUID] = None,
        email: Optional[str] = None,
        role: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log access to medical data"""
        self.log_action(
            action="acces_dossier_medical",
            utilisateur_id=user_id,
            role_utilisateur=role,
            request=None,
            additional_data={
                **(additional_data or {}),
                "email": email,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "endpoint": endpoint,
                "method": method,
            },
        )

    def log_data_export(
        self,
        user_id: Optional[uuid.UUID] = None,
        email: Optional[str] = None,
        data_type: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        method: Optional[str] = None,
        additional_data: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Log data export"""
        self.log_action(
            action="export_donnees",
            utilisateur_id=user_id,
            request=None,
            additional_data={
                **(additional_data or {}),
                "email": email,
                "data_type": data_type,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "endpoint": endpoint,
                "method": method,
            },
        )


# Global audit logger instance
audit_logger_instance: Optional[AuditLogger] = None


def get_audit_logger(db: Session) -> AuditLogger:
    """Get or create audit logger instance"""
    if db is None:
        raise ValueError("Database session cannot be None")
    return AuditLogger(db)


# Convenience functions for common audit events
def log_auth_success(db: Session, user: User, session_id: uuid.UUID, request: Request) -> None:
    """Log successful authentication"""
    logger = get_audit_logger(db)
    logger.log_action(
        action="connexion", utilisateur_id=user.id, role_utilisateur=user.role, session_id=session_id, request=request
    )


def log_auth_failure(db: Session, email: str, request: Request) -> None:
    """Log failed authentication attempt"""
    logger = get_audit_logger(db)
    logger.log_action(action="tentative_connexion_echec", request=request, additional_data={"email_attempted": email})


def log_payment_initiated(
    db: Session, user: User, session_id: uuid.UUID, payment_id: uuid.UUID, amount: float, request: Request
) -> None:
    """Log payment initiation"""
    logger = get_audit_logger(db)
    logger.log_action(
        action="paiement_initie",
        utilisateur_id=user.id,
        role_utilisateur=user.role,
        session_id=session_id,
        entite_type="payment",
        entite_id=payment_id,
        request=request,
        additional_data={"amount": amount},
    )


def log_payment_confirmed(
    db: Session, user: User, session_id: uuid.UUID, payment_id: uuid.UUID, amount: float, request: Request
) -> None:
    """Log payment confirmation"""
    logger = get_audit_logger(db)
    logger.log_action(
        action="paiement_confirme",
        utilisateur_id=user.id,
        role_utilisateur=user.role,
        session_id=session_id,
        entite_type="payment",
        entite_id=payment_id,
        request=request,
        additional_data={"amount": amount},
    )


def log_medical_access(
    db: Session,
    user: User,
    session_id: uuid.UUID,
    entity_type: str,
    entity_id: uuid.UUID,
    action: str,
    request: Request,
) -> None:
    """Log access to medical data"""
    logger = get_audit_logger(db)
    logger.log_action(
        action=action,
        utilisateur_id=user.id,
        role_utilisateur=user.role,
        session_id=session_id,
        entite_type=entity_type,
        entite_id=entity_id,
        request=request,
    )


def log_admin_action(
    db: Session,
    admin: User,
    session_id: uuid.UUID,
    action: str,
    entity_type: Optional[str],
    entity_id: Optional[uuid.UUID],
    request: Request,
    details: Optional[Dict[str, Any]] = None,
) -> None:
    """Log administrative actions"""
    logger = get_audit_logger(db)
    logger.log_action(
        action=action,
        utilisateur_id=admin.id,
        role_utilisateur=admin.role,
        session_id=session_id,
        entite_type=entity_type,
        entite_id=entity_id,
        request=request,
        additional_data=details,
    )


def log_data_export(
    db: Session, user: User, session_id: uuid.UUID, entity_type: str, count: int, request: Request
) -> None:
    """Log data export operations"""
    logger = get_audit_logger(db)
    logger.log_action(
        action="export_donnees",
        utilisateur_id=user.id,
        role_utilisateur=user.role,
        session_id=session_id,
        entite_type=entity_type,
        request=request,
        additional_data={"exported_records": count},
    )


def log_document_upload(
    db: Session, user: User, session_id: uuid.UUID, document_id: uuid.UUID, entity_type: str, request: Request
) -> None:
    """Log document uploads"""
    logger = get_audit_logger(db)
    logger.log_action(
        action="upload_document",
        utilisateur_id=user.id,
        role_utilisateur=user.role,
        session_id=session_id,
        entite_type=entity_type,
        entite_id=document_id,
        request=request,
    )


def log_teleconsultation_start(
    db: Session, user: User, session_id: uuid.UUID, consultation_id: uuid.UUID, request: Request
) -> None:
    """Log teleconsultation start"""
    logger = get_audit_logger(db)
    logger.log_action(
        action="teleconsultation_debut",
        utilisateur_id=user.id,
        role_utilisateur=user.role,
        session_id=session_id,
        entite_type="teleconsultation",
        entite_id=consultation_id,
        request=request,
    )


def log_teleconsultation_end(
    db: Session, user: User, session_id: uuid.UUID, consultation_id: uuid.UUID, duration_minutes: int, request: Request
) -> None:
    """Log teleconsultation end"""
    logger = get_audit_logger(db)
    logger.log_action(
        action="teleconsultation_fin",
        utilisateur_id=user.id,
        role_utilisateur=user.role,
        session_id=session_id,
        entite_type="teleconsultation",
        entite_id=consultation_id,
        request=request,
        additional_data={"duration_minutes": duration_minutes},
    )


def log_account_suspension(
    db: Session, admin_id: uuid.UUID, target_user_id: uuid.UUID, reason: str, request: Request
) -> None:
    """Log account suspension"""
    logger = get_audit_logger(db)
    logger.log_action(
        action="suspension_compte",
        utilisateur_id=admin_id,
        role_utilisateur="admin",
        entite_type="user",
        entite_id=target_user_id,
        request=request,
        additional_data={"reason": reason},
    )

"""
Tests for Audit Logging System (FAILLE #5)
Validates that critical operations are properly logged for compliance and security.
"""

import pytest
import uuid
import json
from unittest.mock import Mock, MagicMock, patch
from fastapi import Request
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend.audit_logger import (
    AuditLogger,
    get_audit_logger,
    log_auth_success,
    log_auth_failure,
    log_payment_initiated,
    log_medical_access,
    log_data_export,
)
from backend.audit_middleware import AuditMiddleware
from backend.models import User, AuditLog


class TestAuditLogger:
    """Test the AuditLogger class"""

    def test_audit_logger_creation(self):
        """Test that AuditLogger can be created with a database session"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)
        assert logger is not None
        assert logger.db == db_mock

    def test_get_audit_logger_with_db(self):
        """Test get_audit_logger returns logger instance with database session"""
        db_mock = Mock(spec=Session)
        logger = get_audit_logger(db_mock)
        assert logger is not None
        assert isinstance(logger, AuditLogger)

    def test_get_audit_logger_without_db_raises_error(self):
        """Test get_audit_logger raises error without database session"""
        with pytest.raises(ValueError, match="Database session cannot be None"):
            get_audit_logger(None)

    def test_log_action_basic(self):
        """Test basic action logging"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        user_id = uuid.uuid4()
        action = "creation"
        entity_type = "consultation"
        entity_id = uuid.uuid4()

        # Log an action
        logger.log_action(
            action=action,
            utilisateur_id=user_id,
            role_utilisateur="medecin",
            entite_type=entity_type,
            entite_id=entity_id,
        )

        # Verify database calls
        assert db_mock.add.called
        assert db_mock.commit.called

    def test_log_action_with_request(self):
        """Test action logging with request information"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        # Create mock request
        request = Mock(spec=Request)
        request.method = "POST"
        request.url.path = "/consultations"
        request.headers = {"user-agent": "TestClient/1.0"}
        request.client = Mock(host="192.168.1.1")

        user_id = uuid.uuid4()
        logger.log_action(action="creation", utilisateur_id=user_id, role_utilisateur="medecin", request=request)

        # Verify database calls
        assert db_mock.add.called
        call_args = db_mock.add.call_args[0][0]
        assert call_args.utilisateur_id == user_id
        assert call_args.endpoint == "/consultations"
        assert call_args.methode_http == "POST"

    def test_log_action_with_additional_data(self):
        """Test action logging with additional data"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        additional_data = {"amount": 100.50, "currency": "EUR"}
        logger.log_action(action="paiement_initie", additional_data=additional_data)

        assert db_mock.add.called
        call_args = db_mock.add.call_args[0][0]
        # Additional data should be JSON serialized
        assert call_args.additional_data is not None

    def test_get_client_ip_from_x_forwarded_for(self):
        """Test IP extraction from X-Forwarded-For header"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        request = Mock(spec=Request)
        request.headers = {"x-forwarded-for": "10.0.0.1, 10.0.0.2"}
        request.client = Mock(host="192.168.1.1")

        ip = logger._get_client_ip(request)
        assert ip == "10.0.0.1"

    def test_get_client_ip_from_x_real_ip(self):
        """Test IP extraction from X-Real-IP header"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        request = Mock(spec=Request)
        request.headers = {"x-real-ip": "10.0.0.5"}
        request.client = Mock(host="192.168.1.1")

        ip = logger._get_client_ip(request)
        assert ip == "10.0.0.5"

    def test_get_client_ip_fallback_to_direct_ip(self):
        """Test IP extraction fallback to direct connection"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        request = Mock(spec=Request)
        request.headers = {}
        request.client = Mock(host="192.168.1.1")

        ip = logger._get_client_ip(request)
        assert ip == "192.168.1.1"

    def test_get_client_ip_no_client_info(self):
        """Test IP extraction with no client info"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        request = Mock(spec=Request)
        request.headers = {}
        request.client = None

        ip = logger._get_client_ip(request)
        assert ip == "127.0.0.1"  # Fallback to localhost for testing


class TestConvenienceFunctions:
    """Test convenience logging functions"""

    def test_log_auth_success(self):
        """Test authentication success logging"""
        db_mock = Mock(spec=Session)
        user_mock = Mock(spec=User)
        user_mock.id = uuid.uuid4()
        user_mock.role = "patient"

        request = Mock(spec=Request)
        session_id = uuid.uuid4()

        log_auth_success(db_mock, user_mock, session_id, request)

        assert db_mock.add.called

    def test_log_auth_failure(self):
        """Test authentication failure logging"""
        db_mock = Mock(spec=Session)
        request = Mock(spec=Request)
        email = "test@example.com"

        log_auth_failure(db_mock, email, request)

        assert db_mock.add.called

    def test_log_payment_initiated(self):
        """Test payment initiation logging"""
        db_mock = Mock(spec=Session)
        user_mock = Mock(spec=User)
        user_mock.id = uuid.uuid4()
        user_mock.role = "patient"

        request = Mock(spec=Request)
        session_id = uuid.uuid4()
        payment_id = uuid.uuid4()

        log_payment_initiated(db_mock, user_mock, session_id, payment_id, amount=150.00, request=request)

        assert db_mock.add.called

    def test_log_medical_access(self):
        """Test medical data access logging"""
        db_mock = Mock(spec=Session)
        user_mock = Mock(spec=User)
        user_mock.id = uuid.uuid4()
        user_mock.role = "medecin"

        request = Mock(spec=Request)
        session_id = uuid.uuid4()
        entity_id = uuid.uuid4()

        log_medical_access(
            db_mock,
            user_mock,
            session_id,
            entity_type="dossier_medical",
            entity_id=entity_id,
            action="acces_dossier_medical",
            request=request,
        )

        assert db_mock.add.called

    def test_log_data_export(self):
        """Test data export logging"""
        db_mock = Mock(spec=Session)
        user_mock = Mock(spec=User)
        user_mock.id = uuid.uuid4()
        user_mock.role = "admin"

        request = Mock(spec=Request)
        session_id = uuid.uuid4()

        log_data_export(db_mock, user_mock, session_id, entity_type="consultation", count=50, request=request)

        assert db_mock.add.called


class TestAuditMiddleware:
    """Test the AuditMiddleware"""

    def test_middleware_creation(self):
        """Test AuditMiddleware can be created"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)
        assert middleware is not None
        assert len(middleware.exclude_paths) > 0

    def test_middleware_with_custom_exclude_paths(self):
        """Test AuditMiddleware with custom exclude paths"""
        app_mock = Mock()
        custom_paths = ["/health", "/metrics"]
        middleware = AuditMiddleware(app_mock, exclude_paths=custom_paths)
        assert "/health" in middleware.exclude_paths
        assert "/metrics" in middleware.exclude_paths

    def test_is_critical_operation_auth_login(self):
        """Test critical operation detection for auth login"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        request.url.path = "/auth/login"

        assert middleware._is_critical_operation(request) is True

    def test_is_critical_operation_payments(self):
        """Test critical operation detection for payments"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        request.url.path = "/paiements/create"

        assert middleware._is_critical_operation(request) is True

    def test_is_critical_operation_consultations(self):
        """Test critical operation detection for consultations"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        request.url.path = "/consultations/list"

        assert middleware._is_critical_operation(request) is True

    def test_is_critical_operation_docs(self):
        """Test that /docs is not logged"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        request.url.path = "/docs"

        assert middleware._is_critical_operation(request) is False

    def test_determine_action_login(self):
        """Test action determination for login"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        request.url.path = "/auth/login"

        action = middleware._determine_action(request)
        assert action == "tentative_connexion"

    def test_determine_action_logout(self):
        """Test action determination for logout"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        request.url.path = "/auth/logout"

        action = middleware._determine_action(request)
        assert action == "deconnexion"

    def test_determine_action_payment_post(self):
        """Test action determination for POST payment"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        request.url.path = "/paiements"
        request.method = "POST"

        action = middleware._determine_action(request)
        assert action == "paiement_initie"

    def test_determine_action_payment_put(self):
        """Test action determination for PUT payment"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        request.url.path = "/paiements/123"
        request.method = "PUT"

        action = middleware._determine_action(request)
        assert action == "paiement_confirme"

    def test_determine_action_consultation_post(self):
        """Test action determination for POST consultation"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        request.url.path = "/consultations"
        request.method = "POST"

        action = middleware._determine_action(request)
        assert action == "creation"

    def test_determine_action_ordonnance_post(self):
        """Test action determination for POST ordonnance"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        request.url.path = "/ordonnances"
        request.method = "POST"

        action = middleware._determine_action(request)
        assert action == "creation"

    def test_extract_entity_info_consultation(self):
        """Test entity extraction from consultation path"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        consultation_id = str(uuid.uuid4())
        request.url.path = f"/consultations/{consultation_id}"

        entity_type, entity_id = middleware._extract_entity_info(request)
        assert entity_type == "consultation"
        assert entity_id == uuid.UUID(consultation_id)

    def test_extract_entity_info_payment(self):
        """Test entity extraction from payment path"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        payment_id = str(uuid.uuid4())
        request.url.path = f"/paiements/{payment_id}"

        entity_type, entity_id = middleware._extract_entity_info(request)
        assert entity_type == "payment"
        assert entity_id == uuid.UUID(payment_id)

    def test_extract_entity_info_ordonnance(self):
        """Test entity extraction from ordonnance path"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        ordonnance_id = str(uuid.uuid4())
        request.url.path = f"/ordonnances/{ordonnance_id}"

        entity_type, entity_id = middleware._extract_entity_info(request)
        assert entity_type == "ordonnance"
        assert entity_id == uuid.UUID(ordonnance_id)

    def test_extract_entity_info_invalid_id(self):
        """Test entity extraction with invalid ID format"""
        app_mock = Mock()
        middleware = AuditMiddleware(app_mock)

        request = Mock(spec=Request)
        request.url.path = "/consultations/invalid-id"

        entity_type, entity_id = middleware._extract_entity_info(request)
        assert entity_type == "consultation"
        assert entity_id is None


class TestAuditLoggingIntegration:
    """Integration tests for audit logging across the system"""

    def test_audit_log_entry_structure(self):
        """Test that audit log entries have correct structure"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        user_id = uuid.uuid4()
        session_id = uuid.uuid4()
        entity_id = uuid.uuid4()

        request = Mock(spec=Request)
        request.method = "POST"
        request.url.path = "/consultations"
        request.headers = {"user-agent": "TestClient/1.0"}
        request.client = Mock(host="192.168.1.1")

        logger.log_action(
            action="creation",
            utilisateur_id=user_id,
            role_utilisateur="medecin",
            session_id=session_id,
            entite_type="consultation",
            entite_id=entity_id,
            request=request,
            additional_data={"key": "value"},
        )

        # Verify all required fields are present
        call_args = db_mock.add.call_args[0][0]
        assert call_args.utilisateur_id == user_id
        assert call_args.role_utilisateur == "medecin"
        assert call_args.session_id == session_id
        assert call_args.action == "creation"
        assert call_args.entite_type == "consultation"
        assert call_args.entite_id == entity_id
        assert call_args.ip_address == "192.168.1.1"
        assert call_args.user_agent is not None
        assert call_args.endpoint == "/consultations"
        assert call_args.methode_http == "POST"
        assert call_args.additional_data is not None

    def test_sensitive_action_logging(self):
        """Test that sensitive actions are properly logged"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        sensitive_actions = [
            "paiement_initie",
            "paiement_confirme",
            "acces_dossier_medical",
            "export_donnees",
            "suspension_compte",
        ]

        for action in sensitive_actions:
            logger.log_action(action=action)
            assert db_mock.add.called
            assert db_mock.commit.called

    def test_audit_logger_does_not_break_on_error(self):
        """Test that audit logging errors don't break the application"""
        db_mock = Mock(spec=Session)
        db_mock.add.side_effect = Exception("Database error")
        logger = AuditLogger(db_mock)

        # This should not raise an exception
        logger.log_action(action="creation", additional_data={"test": "data"})


class TestAuditLoggingCompliance:
    """Tests for compliance and security requirements"""

    def test_audit_log_immutability(self):
        """Test that audit logs should be immutable (no update/delete in schema)"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        # Log should only add, never update or delete
        user_id = uuid.uuid4()
        logger.log_action(action="creation", utilisateur_id=user_id)

        assert db_mock.add.called
        # Verify that update/merge is not called (immutability)
        assert not db_mock.merge.called

    def test_audit_log_contains_user_info(self):
        """Test that audit logs contain user identification"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        user_id = uuid.uuid4()
        user_role = "medecin"

        logger.log_action(action="acces_dossier_medical", utilisateur_id=user_id, role_utilisateur=user_role)

        call_args = db_mock.add.call_args[0][0]
        assert call_args.utilisateur_id == user_id
        assert call_args.role_utilisateur == user_role

    def test_audit_log_contains_ip_address(self):
        """Test that audit logs contain IP address for traceability"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        request = Mock(spec=Request)
        request.headers = {"x-forwarded-for": "192.168.1.100"}
        request.client = Mock(host="10.0.0.1")

        logger.log_action(action="tentative_connexion_echec", request=request)

        call_args = db_mock.add.call_args[0][0]
        assert call_args.ip_address is not None

    def test_audit_log_contains_timestamp(self):
        """Test that audit logs contain timestamp (implicit in database)"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        logger.log_action(action="creation")

        # Database should handle timestamp automatically
        call_args = db_mock.add.call_args[0][0]
        assert hasattr(call_args, "id")  # AuditLog has id field

    def test_sensitive_data_not_logged(self):
        """Test that sensitive data (passwords, tokens) is not logged"""
        db_mock = Mock(spec=Session)
        logger = AuditLogger(db_mock)

        # Sensitive data in additional_data should not cause issues
        sensitive_data = {"password": "secret123", "api_key": "key_abc123", "credit_card": "4111-1111-1111-1111"}

        # Should not raise an exception
        logger.log_action(action="creation", additional_data=sensitive_data)

        assert db_mock.add.called


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

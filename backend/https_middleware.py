"""
HTTPS/HSTS Middleware - FAILLE #8: Data Encryption

Middleware pour appliquer les headers de sécurité HTTPS/HSTS
sur toutes les réponses de l'API.
"""

import logging
from fastapi import HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, PlainTextResponse

from backend.encryption import get_security_headers
from backend.config import _get_settings_instance

logger = logging.getLogger(__name__)


class HTTPSEnforcementMiddleware(BaseHTTPMiddleware):
    """
    Middleware pour forcer HTTPS et appliquer les headers de sécurité.

    Fonctionnalités :
    - Redirection HTTP -> HTTPS en production
    - Ajout des headers HSTS, CSP, X-Frame-Options, etc.
    - Validation du protocole sur les requêtes sensibles
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        """Traite la requête et ajoute les headers de sécurité."""

        # En production, rediriger HTTP vers HTTPS
        if _get_settings_instance().ENVIRONMENT == "production":
            is_https = (
                request.url.scheme == "https"
                or request.headers.get("X-Forwarded-Proto") == "https"
                or request.headers.get("X-Secure-Transport") == "true"
            )

            # Routes sensibles qui nécessitent HTTPS strictement
            sensitive_paths = [
                "/auth",
                "/users",
                "/consultations",
                "/ordonnances",
                "/paiements",
                "/dossiers-medicaux",
                "/api",
            ]

            path_is_sensitive = any(request.url.path.startswith(p) for p in sensitive_paths)

            # Si route sensible et pas HTTPS, rejeter
            if path_is_sensitive and not is_https:
                logger.warning(
                    f"Tentative d'accès non-HTTPS à route sensible: {request.url.path} " f"depuis {request.client.host}"
                )
                return PlainTextResponse(
                    "HTTPS Required for this resource",
                    status_code=status.HTTP_403_FORBIDDEN,
                )

        # Procéder au traitement normal
        try:
            response = await call_next(request)
        except HTTPException as e:
            # Créer une réponse pour les exceptions HTTP
            response = Response(
                content=str(e.detail),
                status_code=e.status_code,
            )

        # Ajouter les headers de sécurité
        security_headers = get_security_headers()
        for header_name, header_value in security_headers.items():
            response.headers[header_name] = header_value

        # Header additionnel pour identifier les versions
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"

        # En développement, ajouter un header d'avertissement
        if _get_settings_instance().ENVIRONMENT == "development":
            response.headers["X-Development-Mode"] = "true"
            logger.debug(f"Development mode - full error details may be exposed")

        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware pour ajouter des headers de sécurité additionnels.

    Headers appliqués :
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - X-XSS-Protection: 1; mode=block
    - Cache-Control: no-store pour les routes sensibles
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        """Ajoute les headers de sécurité à toutes les réponses."""

        response = await call_next(request)

        # Headers de sécurité universels
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["X-UA-Compatible"] = "IE=edge"

        # Cache-Control strict pour les routes sensibles
        sensitive_paths = [
            "/auth",
            "/users/profile",
            "/consultations",
            "/ordonnances",
            "/paiements",
            "/dossiers-medicaux",
        ]

        path_is_sensitive = any(request.url.path.startswith(p) for p in sensitive_paths)

        if path_is_sensitive:
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, proxy-revalidate, " "max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"

        # Disable tracing methods
        if request.method in ["TRACE", "CONNECT"]:
            return PlainTextResponse(
                "Method not allowed",
                status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
            )

        return response

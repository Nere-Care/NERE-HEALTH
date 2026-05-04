"""
JWT Authentication Middleware - FAILLE #7: JWT Authentication & Token Rotation

Middleware FastAPI pour l'authentification JWT avec rotation automatique.
Valide les tokens sur chaque requête et gère la rotation proactive.
"""

import logging
from typing import Optional
from uuid import UUID

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from backend.audit_logger import get_audit_logger
from backend.db import get_db, SessionLocal
from backend.jwt_handler import JWTHandler
from backend.models import User
from backend.token_blacklist import token_blacklist

logger = logging.getLogger(__name__)


class JWTAuthenticationMiddleware(BaseHTTPMiddleware):
    """
    Middleware d'authentification JWT avec rotation automatique.

    Fonctionnalités :
    - Validation des tokens sur chaque requête
    - Rotation proactive des tokens expirant bientôt
    - Révocation des tokens compromis
    - Audit automatique des accès
    """

    async def dispatch(self, request: Request, call_next):
        # Traiter les routes publiques
        public_paths = {
            "/",
            "/auth/token",
            "/auth/register",
            "/auth/reset-password",
            "/openapi.json",
            "/health",
            "/api/paiements/webhook",
            "/debug/request-state",
        }
        public_prefixes = [
            "/docs",
            "/redoc",
            "/debug",
        ]

        path = request.url.path
        authorization = request.headers.get("Authorization")

        # Special case: /debug/request-state is public, but if Authorization is provided
        # we still attempt to populate request.state.user for debugging purposes.
        if path == "/debug/request-state":
            if authorization and authorization.startswith("Bearer "):
                token = authorization.split(" ", 1)[1]
                db: Session = SessionLocal()
                try:
                    payload, error = JWTHandler.validate_token_and_get_user(db, token, "access")
                    if payload and not error:
                        user_id = UUID(payload["sub"])
                        user = db.query(User).filter(User.id == user_id).first()
                        if user:
                            request.state.user = user
                            request.state.user_id = str(user.id)
                            request.state.user_role = user.role
                except Exception as e:
                    pass  # Ignore debug auth errors
                finally:
                    db.close()
            return await call_next(request)

        if path in public_paths or any(path.startswith(prefix) for prefix in public_prefixes):
            return await call_next(request)
        logger.debug(f"Path: {path}, Authorization header present: {bool(authorization)}")

        if not authorization or not authorization.startswith("Bearer "):
            logger.warning(f"Missing or invalid authorization header for {path}")
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Token d'authentification requis"},
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = authorization.split(" ")[1]
        logger.debug(f"Validating token for path: {path}, token length: {len(token)}")

        # Obtenir une session DB
        db: Session = SessionLocal()

        try:
            # Valider le token
            payload, error = JWTHandler.validate_token_and_get_user(db, token, "access")

            if error:
                logger.warning(f"Token validation failed for {path}: {error}")
                # Logger l'échec d'authentification
                audit_logger = get_audit_logger(db)
                audit_logger.log_auth_failure(
                    email=payload.get("email") if payload else "unknown",
                    reason=error,
                    ip_address=self._get_client_ip(request),
                    user_agent=request.headers.get("User-Agent"),
                    endpoint=path,
                    method=request.method,
                )

                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": error},
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Vérifier si le token est révoqué (blacklist)
            if token_blacklist.is_revoked(token):
                logger.warning(f"Token is revoked for {path}")
                # Log the revoked token attempt
                audit_logger = get_audit_logger(db)
                audit_logger.log_auth_failure(
                    email=payload.get("email") if payload else "unknown",
                    reason="Token revoked",
                    ip_address=self._get_client_ip(request),
                    user_agent=request.headers.get("User-Agent"),
                    endpoint=path,
                    method=request.method,
                )
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Token has been revoked"},
                    headers={"WWW-Authenticate": "Bearer"},
                )

            # Token valide - récupérer l'utilisateur
            user_id = UUID(payload["sub"])
            user = db.query(User).filter(User.id == user_id).first()

            if not user:
                logger.warning(f"User not found for token in path: {path}")
                return JSONResponse(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    content={"detail": "Utilisateur non trouvé"},
                )
            # Vérifier si le token doit être roté
            if JWTHandler.should_rotate_token(token):
                try:
                    # Effectuer la rotation
                    new_access_token, new_refresh_token = JWTHandler.rotate_tokens(
                        db=db,
                        old_access_token=token,
                        user=user,
                        reason="proactive",
                        ip_address=self._get_client_ip(request),
                        user_agent=request.headers.get("User-Agent"),
                    )

                    # Ajouter les nouveaux tokens aux headers de réponse
                    request.scope["new_access_token"] = new_access_token
                    request.scope["new_refresh_token"] = new_refresh_token

                except Exception as e:
                    logger.error(f"Token rotation error: {str(e)}")
                    # Logger l'erreur de rotation mais continuer
                    audit_logger = get_audit_logger(db)
                    audit_logger.log_auth_failure(
                        email=user.email,
                        reason=f"Erreur rotation token: {str(e)}",
                        ip_address=self._get_client_ip(request),
                        user_agent=request.headers.get("User-Agent"),
                        endpoint=path,
                        method=request.method,
                    )

            # Logger l'accès réussi
            audit_logger = get_audit_logger(db)
            audit_logger.log_auth_success(
                user_id=user.id,
                email=user.email,
                role=user.role,
                ip_address=self._get_client_ip(request),
                user_agent=request.headers.get("User-Agent"),
                endpoint=path,
                method=request.method,
            )

            # Ajouter l'utilisateur à l'état de la requête pour les dépendances
            logger.debug(f"request object type: {type(request)}")
            logger.debug(f"request.state type before: {type(request.state)}")
            request.state.user = user
            logger.debug(f"getattr check: {getattr(request.state, 'user', None)}")
            request.state.user_id = str(user.id)
            request.state.user_role = user.role

        except Exception as e:
            logger.error(f"Middleware error: {str(e)}", exc_info=True)
            # Erreur inattendue
            audit_logger = get_audit_logger(db)
            audit_logger.log_auth_failure(
                email="unknown",
                reason=f"Erreur middleware: {str(e)}",
                ip_address=self._get_client_ip(request),
                user_agent=request.headers.get("User-Agent"),
                endpoint=path,
                method=request.method,
            )

            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"detail": "Erreur d'authentification"},
            )

        finally:
            db.close()

        # Continuer avec la requête
        return await call_next(request)

    @staticmethod
    def _get_client_ip(request: Request) -> Optional[str]:
        """Extrait l'adresse IP réelle du client."""
        # X-Forwarded-For (dernière IP si multiple proxies)
        x_forwarded_for = request.headers.get("X-Forwarded-For")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0].strip()

        # X-Real-IP
        x_real_ip = request.headers.get("X-Real-IP")
        if x_real_ip:
            return x_real_ip

        # Adresse directe
        return request.client.host if request.client else None

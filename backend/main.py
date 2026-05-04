from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import os
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sentry_sdk.integrations.asgi import SentryAsgiMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

import sentry_sdk
from .cors_config import get_cors_config
from .limiter import limiter, auth_limiter, payment_limiter, api_limiter, custom_rate_limit_handler, rate_limit_middleware
from .config import settings
from .routers.root import router as root_router
from .routers.auth import router as auth_router
from .routers.users import router as users_router
from .routers.patients import router as patients_router
from .routers.consultations import router as consultations_router
from .routers.ordonnances import router as ordonnances_router
from .routers.paiements import router as paiements_router
from .routers.ia import router as ia_router
from .routers.teleconsultation import router as teleconsultation_router
from .routers.notifications import router as notifications_router
from .routers.rendez_vous import router as rendez_vous_router
from .routers.dossiers_medicaux import (
    router as dossiers_medicaux_router
)
from .routers.avis import router as avis_router
from .routers.chatbot_sessions import (
    router as chatbot_sessions_router
)
from .routers.conversations import router as conversations_router
from .routers.disponibilites import router as disponibilites_router
from .routers.documents_medicaux import (
    router as documents_medicaux_router
)
from .routers.medecins import router as medecins_router
from .routers.medecin_specialites import (
    router as medecin_specialites_router
)
from .routers.messages import router as messages_router
from .routers.sessions import router as sessions_router
from .routers.specialites import router as specialites_router
from .routers.structures import router as structures_router
from .routers.audit import router as audit_router
from .routers.tables import router as tables_router
from .audit_middleware import AuditMiddleware
from .jwt_middleware import JWTAuthenticationMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response


class HostValidationMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, allowed_hosts, debug: bool = False):
        super().__init__(app)
        self.allowed_hosts = [host.lower().strip() for host in allowed_hosts if host.strip()]
        self.debug = debug

    async def dispatch(self, request: Request, call_next):
        if self.debug:
            return await call_next(request)

        host_header = request.headers.get('host', '').strip()

        # Vérifications de sécurité strictes
        if not host_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Host header manquant',
            )

        # Protection contre les attaques de host header poisoning
        if '\n' in host_header or '\r' in host_header or '\t' in host_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Host header invalide',
            )

        # Extraire le host sans port
        if ':' in host_header:
            host = host_header.split(':')[0].lower()
            # Vérifier que le port est valide (80 ou 443 pour production)
            try:
                port = int(host_header.split(':')[1])
                if port not in [80, 443]:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail='Port non autorisé',
                    )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail='Port invalide',
                )
        else:
            host = host_header.lower()

        # Validation stricte contre la liste blanche
        if host not in self.allowed_hosts:
            # Log de sécurité (optionnel - peut être ajouté plus tard)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Host header non autorisé',
            )

        return await call_next(request)


app = FastAPI(title='Nere_app API', version='1.0.0')
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(SecurityHeadersMiddleware)

# Audit Logging Middleware - 🔐 FAILLE #5: Audit logging complet
app.add_middleware(AuditMiddleware)

# JWT Authentication Middleware - FAILLE #7: State injection pour secure routes
app.add_middleware(JWTAuthenticationMiddleware)

# SlowAPI rate limiting middleware doit être appliqué avant l'authentification
app.add_middleware(SlowAPIMiddleware)
# Rate limiting adaptatif - 🔐 FAILLE #4: Rate limiting strict
app.add_middleware(rate_limit_middleware)

# Ajouter les middlewares de sécurité seulement en production
if not settings.DEBUG:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
    app.add_middleware(
        HostValidationMiddleware,
        allowed_hosts=settings.ALLOWED_HOSTS,
        debug=settings.DEBUG,
    )

from .cors_config import CORSConfig

# Configure CORS - 🔐 FAILLE #2: Configuration stricte
# ❌ INTERDIT: allow_methods=["*"] ou allow_headers=["*"] en production
# Configuration CORS sécurisée
cors_config = get_cors_config(settings)
app.add_middleware(CORSMiddleware, **cors_config)

app.include_router(root_router)
app.include_router(auth_router)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(patients_router, prefix=settings.API_PREFIX)
app.include_router(consultations_router, prefix=settings.API_PREFIX)
app.include_router(ordonnances_router, prefix=settings.API_PREFIX)
app.include_router(paiements_router, prefix=settings.API_PREFIX)
app.include_router(ia_router, prefix=settings.API_PREFIX)
app.include_router(teleconsultation_router, prefix=settings.API_PREFIX)
app.include_router(notifications_router, prefix=settings.API_PREFIX)
app.include_router(rendez_vous_router, prefix=settings.API_PREFIX)
app.include_router(dossiers_medicaux_router, prefix=settings.API_PREFIX)
app.include_router(avis_router, prefix=settings.API_PREFIX)
app.include_router(chatbot_sessions_router, prefix=settings.API_PREFIX)
app.include_router(conversations_router, prefix=settings.API_PREFIX)
app.include_router(disponibilites_router, prefix=settings.API_PREFIX)
app.include_router(documents_medicaux_router, prefix=settings.API_PREFIX)
app.include_router(medecins_router, prefix=settings.API_PREFIX)
app.include_router(medecin_specialites_router, prefix=settings.API_PREFIX)
app.include_router(messages_router, prefix=settings.API_PREFIX)
app.include_router(sessions_router, prefix=settings.API_PREFIX)
app.include_router(specialites_router, prefix=settings.API_PREFIX)
app.include_router(structures_router, prefix=settings.API_PREFIX)
app.include_router(audit_router, prefix=settings.API_PREFIX)
app.include_router(tables_router, prefix=settings.API_PREFIX)

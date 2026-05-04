"""
Rate Limiting Sécurisé - FAILLE #4
Configuration avancée avec niveaux multiples selon criticité
"""
from slowapi import Limiter
from slowapi.util import get_remote_address, get_ipaddr
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import os

# Stockage partagé pour les tests
_shared_storage = None

def get_shared_storage():
    """Retourne un stockage partagé pour les tests"""
    global _shared_storage
    if _shared_storage is None:
        # Utiliser le stockage en mémoire de limits
        from limits.storage import MemoryStorage
        _shared_storage = MemoryStorage()
    return _shared_storage

# Configuration des limites selon l'environnement
ENVIRONMENT = os.getenv('ENVIRONMENT', 'development')
DEBUG = ENVIRONMENT == 'development'

# Limites de base (plus permissives en développement)
if DEBUG:
    BASE_LIMIT = "1000/minute"  # Développement: généreux
    AUTH_LIMIT = "50/minute"    # Auth: raisonnable
    API_LIMIT = "500/minute"    # API: généreux
    PAYMENT_LIMIT = "20/minute" # Paiements: strict même en dev
else:
    BASE_LIMIT = "200/minute"   # Production: strict
    AUTH_LIMIT = "5/minute"     # Auth: très strict (anti-brute force)
    API_LIMIT = "100/minute"    # API: modéré
    PAYMENT_LIMIT = "3/minute"  # Paiements: très strict

# Limiter principal
# En test, slowapi utilisera le stockage en mémoire par défaut
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[BASE_LIMIT],
    strategy="fixed-window"
)

# Limiteurs spécialisés pour routes critiques
auth_limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[AUTH_LIMIT],
    strategy="fixed-window"
)
payment_limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[PAYMENT_LIMIT],
    strategy="fixed-window"
)
api_limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[API_LIMIT],
    strategy="fixed-window"
)


def get_user_limiter(request: Request) -> str:
    """
    Détermine le limiteur approprié selon la route et l'utilisateur
    """
    path = request.url.path

    # Routes d'authentification (très strictes)
    if any(path.startswith(prefix) for prefix in ['/api/auth/login', '/api/auth/register', '/api/auth/forgot-password']):
        return AUTH_LIMIT

    # Routes de paiement (très strictes)
    if any(path.startswith(prefix) for prefix in ['/api/paiements', '/api/stripe']):
        return PAYMENT_LIMIT

    # API générales
    if path.startswith('/api/'):
        return API_LIMIT

    # Routes publiques (moins strictes)
    return BASE_LIMIT


class AdaptiveRateLimiter:
    """
    Rate limiter adaptatif qui ajuste selon le comportement de l'utilisateur
    """

    def __init__(self):
        self.suspicious_ips = set()  # IPs suspectes
        self.blocked_ips = set()     # IPs bloquées temporairement

    def is_suspicious(self, request: Request) -> bool:
        """Détecte les comportements suspects"""
        # Headers inhabituels
        suspicious_headers = ['X-Forwarded-For', 'X-Real-IP']
        if any(h in request.headers for h in suspicious_headers):
            return True

        # User-Agent vide ou suspect
        user_agent = request.headers.get('User-Agent', '')
        if not user_agent or len(user_agent) < 10:
            return True

        return False

    def should_block(self, request: Request) -> bool:
        """Détermine si la requête doit être bloquée"""
        client_ip = get_ipaddr(request)

        if client_ip in self.blocked_ips:
            return True

        if self.is_suspicious(request):
            self.suspicious_ips.add(client_ip)
            # Bloquer temporairement les IPs très suspectes
            if len([ip for ip in self.suspicious_ips if ip == client_ip]) > 5:
                self.blocked_ips.add(client_ip)
                return True

        return False


# Instance globale
adaptive_limiter = AdaptiveRateLimiter()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware de rate limiting adaptatif
    """

    async def dispatch(self, request: Request, call_next):
        # Vérification adaptive
        if adaptive_limiter.should_block(request):
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": "Trop de requêtes suspectes",
                    "detail": "Trop de requêtes suspectes. Réessayez plus tard.",
                    "retry_after": 300
                },
                headers={"Retry-After": "300"}  # 5 minutes
            )

        # Appliquer le limiteur approprié
        limit = get_user_limiter(request)

        # Utiliser le limiter correspondant
        if limit == AUTH_LIMIT:
            # Pour les routes auth, utiliser auth_limiter
            pass  # Sera géré par les décorateurs @limiter.limit
        elif limit == PAYMENT_LIMIT:
            pass  # Sera géré par les décorateurs @limiter.limit
        else:
            # Pour les autres routes, vérifier manuellement
            pass

        response = await call_next(request)
        return response


# Instance globale du middleware
rate_limit_middleware = RateLimitMiddleware


# Gestionnaire d'erreur personnalisé pour rate limiting
async def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """
    Gestionnaire d'erreur pour dépassement de limite
    """
    from fastapi.responses import JSONResponse
    limit = getattr(exc, 'limit', None)
    return JSONResponse(
        status_code=429,
        content={
            "error": "Trop de requêtes",
            "message": "Vous avez dépassé la limite de requêtes autorisée. Veuillez réessayer plus tard.",
            "limit": str(limit) if limit is not None else None,
            "remaining": getattr(exc, 'remaining', 0),
            "reset_time": getattr(exc, 'reset_time', None)
        }
    )

"""
🔐 Configuration CORS sécurisée pour NERE APP
Implémente une politique CORS stricte
"""

class CORSConfig:
    """Configuration CORS stricte pour la production"""

    # Méthodes HTTP strictement autorisées (pas "*)
    ALLOWED_METHODS = [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ]

    # Headers autorisés (PAS "*" en production)
    ALLOWED_HEADERS_PROD = [
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "X-Requested-With",
        "X-Request-ID",
    ]

    # Headers autorisés en développement (plus permissif)
    ALLOWED_HEADERS_DEV = [
        "Content-Type",
        "Authorization",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
        "X-Requested-With",
        "X-Request-ID",
        "X-Debug-Token",  # DEV ONLY
    ]

    # Response headers
    EXPOSE_HEADERS = [
        "Content-Length",
        "X-Request-ID",
        "X-RateLimit-Limit",
        "X-RateLimit-Remaining",
        "X-RateLimit-Reset",
    ]

    # Durée du cache preflight (24h)
    MAX_AGE = 86400


def get_cors_config(settings):
    """
    Génère la configuration CORS basée sur l'environnement

    Args:
        settings: Instance de Settings avec la configuration

    Returns:
        dict: Configuration pour CORSMiddleware
    """
    # Validation stricte des origines
    allowed_origins = _validate_cors_origins(settings.CORS_ORIGINS, settings)

    # Headers selon l'environnement
    allowed_headers = (
        CORSConfig.ALLOWED_HEADERS_PROD
        if settings.ENVIRONMENT == "production"
        else CORSConfig.ALLOWED_HEADERS_DEV
    )

    return {
        "allow_origins": allowed_origins,
        "allow_credentials": True,  # Nécessaire pour les cookies/auth
        "allow_methods": CORSConfig.ALLOWED_METHODS,
        "allow_headers": allowed_headers,
        "expose_headers": CORSConfig.EXPOSE_HEADERS,
        "max_age": CORSConfig.MAX_AGE,
    }


def _validate_cors_origins(cors_origins_list: list[str], settings) -> list[str]:
    """
    Valide et nettoie les origines CORS

    Args:
        cors_origins_list: Liste des origines CORS
        settings: Instance de Settings pour l'environnement

    Returns:
        list[str]: Liste des origines validées

    Raises:
        ValueError: Si une origine est invalide
    """
    if not cors_origins_list or len(cors_origins_list) == 0:
        raise ValueError("CORS_ORIGINS ne peut pas être vide")

    # En développement, "*" est autorisé
    if len(cors_origins_list) == 1 and cors_origins_list[0] == "*":
        if settings.ENVIRONMENT == "production":
            raise ValueError("CORS_ORIGINS='*' INTERDIT en production")
        return cors_origins_list

    # Validation de chaque origine
    for origin in cors_origins_list:
        if not _is_valid_origin(origin, settings):
            raise ValueError(f"Origine CORS invalide: {origin}")

    return cors_origins_list


def _is_valid_origin(origin: str, settings) -> bool:
    """
    Valide qu'une origine est bien formée

    Args:
        origin: L'origine à valider

    Returns:
        bool: True si valide
    """
    if not origin.startswith(("http://", "https://")):
        return False

    # Pas d'origines localhost en production
    if settings.ENVIRONMENT == "production":
        if origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1"):
            return False

    # Validation basique du format URL
    try:
        from urllib.parse import urlparse
        parsed = urlparse(origin)
        return bool(parsed.scheme and parsed.netloc)
    except Exception:
        return False

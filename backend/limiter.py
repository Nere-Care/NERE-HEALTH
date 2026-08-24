import os

from slowapi import Limiter
from slowapi.util import get_remote_address

_storage_uri = os.getenv('REDIS_URL', '').strip()


def resend_key_func(request):
    """Clé de rate-limit du renvoi d'email : IP + email du compte.

    Sans l'email, tous les comptes d'une même IP partageraient le même
    quota, ce qui bloquerait des utilisateurs distincts (voir tests dev).
    """
    ip = get_remote_address(request)
    email = request.headers.get("x-resend-email", "").strip().lower()
    return f"{ip}:{email}"


# Avec plusieurs workers gunicorn, le stockage mémoire est local à chaque
# worker : les limites ne seraient pas appliquées globalement. On partage donc
# le compteur via Redis quand REDIS_URL est défini, sinon on retombe en mémoire
# (développement / tests).
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=['200/minute'],
    storage_uri=_storage_uri or 'memory://',
)

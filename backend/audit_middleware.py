import time
import traceback
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from db import SessionLocal
from models import AuditLog


# Paths to exclude from logging (health checks, static files, docs)
_EXCLUDED_PREFIXES = ("/health", "/docs", "/openapi.json", "/redoc", "/uploads")

# Map HTTP methods to audit actions
_METHOD_ACTION_MAP = {
    "POST": "creation",
    "PUT": "modification",
    "PATCH": "modification",
    "DELETE": "suppression",
    "GET": "lecture",
}


class AuditLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(path.startswith(p) for p in _EXCLUDED_PREFIXES):
            return await call_next(request)

        start = time.monotonic()
        status_code = 500
        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        except Exception:
            status_code = 500
            raise
        finally:
            duration_ms = int((time.monotonic() - start) * 1000)
            client_ip = request.client.host if request.client else None
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                client_ip = forwarded.split(",")[0].strip()

            action = _METHOD_ACTION_MAP.get(request.method, "lecture")

            db = SessionLocal()
            try:
                log = AuditLog(
                    action=action,
                    ip_address=client_ip,
                    user_agent=str(request.headers.get("user-agent", ""))[:500],
                    endpoint=path[:500],
                    methode_http=request.method,
                    code_http=status_code,
                    duree_ms=duration_ms,
                    succes=200 <= status_code < 400,
                )
                db.add(log)
                db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()

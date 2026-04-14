from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from config import settings
from limiter import limiter
from routers.root import router as root_router
from routers.auth import router as auth_router
from routers.users import router as users_router
from routers.patients import router as patients_router
from routers.consultations import router as consultations_router
from routers.ordonnances import router as ordonnances_router
from routers.paiements import router as paiements_router
from routers.notifications import router as notifications_router
from routers.rendez_vous import router as rendez_vous_router
from routers.dossiers_medicaux import router as dossiers_medicaux_router
from routers.avis import router as avis_router
from routers.chatbot_sessions import router as chatbot_sessions_router
from routers.conversations import router as conversations_router
from routers.disponibilites import router as disponibilites_router
from routers.documents_medicaux import router as documents_medicaux_router
from routers.medecins import router as medecins_router
from routers.medecin_specialites import router as medecin_specialites_router
from routers.messages import router as messages_router
from routers.sessions import router as sessions_router
from routers.specialites import router as specialites_router
from routers.structures import router as structures_router
from routers.audit import router as audit_router
from routers.tables import router as tables_router


class HostValidationMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, allowed_hosts):
        super().__init__(app)
        self.allowed_hosts = [host.lower() for host in allowed_hosts]

    async def dispatch(self, request: Request, call_next):
        if settings.DEBUG:
            return await call_next(request)

        host_header = request.headers.get('host', '')
        host = host_header.split(':')[0].lower()
        if host and host not in self.allowed_hosts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail='Host header non autorisé',
            )
        return await call_next(request)


app = FastAPI(title='Nere_app API', version='1.0.0')
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(HostValidationMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)
app.add_middleware(SlowAPIMiddleware)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS != ['*'] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(root_router)
app.include_router(auth_router)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(patients_router, prefix=settings.API_PREFIX)
app.include_router(consultations_router, prefix=settings.API_PREFIX)
app.include_router(ordonnances_router, prefix=settings.API_PREFIX)
app.include_router(paiements_router, prefix=settings.API_PREFIX)
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

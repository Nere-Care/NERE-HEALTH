from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
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
from routers.avis_structure import router as avis_structure_router
from routers.audit import router as audit_router
from routers.tables import router as tables_router
from routers.exceptions_disponibilites import router as exceptions_disponibilites_router
from routers.posologie import router as posologie_router
from routers.medicaments import router as medicaments_router
from routers.prises_medicaments import router as prises_medicaments_router
from routers.dashboard import router as dashboard_router
from routers.tickets import router as tickets_router
from routers.mises_a_jour import router as mises_a_jour_router
from routers.actualites import router as actualites_router
from routers.confidentialite import router as confidentialite_router
from routers.demandes_avis import router as demandes_avis_router
from routers.analyses import router as analyses_router
from db import engine, SessionLocal
from models import Base, CategorieTicket


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

from sqlalchemy import text
with engine.begin() as conn:
    conn.execute(text("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'portee_enum') THEN CREATE TYPE portee_enum AS ENUM ('cameroun', 'diaspora'); END IF; END $$;"))
    conn.execute(text("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'statut_demande_avis') THEN CREATE TYPE statut_demande_avis AS ENUM ('en_attente', 'acceptee', 'refusee', 'annulee'); END IF; END $$;"))

Base.metadata.create_all(bind=engine)

# Serve uploaded files
import os
os.makedirs("uploads/documents", exist_ok=True)
os.makedirs("uploads/pdfs", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS != ['*'] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(root_router)
app.include_router(auth_router, prefix=settings.API_PREFIX)
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
app.include_router(avis_structure_router, prefix=settings.API_PREFIX)
app.include_router(audit_router, prefix=settings.API_PREFIX)
app.include_router(tables_router, prefix=settings.API_PREFIX)
app.include_router(exceptions_disponibilites_router, prefix=settings.API_PREFIX)
app.include_router(posologie_router, prefix=settings.API_PREFIX)
app.include_router(medicaments_router, prefix=settings.API_PREFIX)
app.include_router(prises_medicaments_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(tickets_router, prefix=settings.API_PREFIX)
app.include_router(mises_a_jour_router, prefix=settings.API_PREFIX)
app.include_router(actualites_router, prefix=settings.API_PREFIX)
app.include_router(confidentialite_router, prefix=settings.API_PREFIX)
app.include_router(demandes_avis_router, prefix=settings.API_PREFIX)
app.include_router(analyses_router, prefix=settings.API_PREFIX)


# --- Scheduler rappels médicaments ---
from services.scheduler import scheduler, rappel_matin, rappel_midi, rappel_soir, check_rdv_reminders

scheduler.add_job(rappel_matin, hour=7, minute=30, job_id="rappel_matin")
scheduler.add_job(rappel_midi, hour=11, minute=30, job_id="rappel_midi")
scheduler.add_job(rappel_soir, hour=19, minute=30, job_id="rappel_soir")
scheduler.add_interval_job(check_rdv_reminders, interval_minutes=5, job_id="rappel_rdv")


# --- Seed catégories tickets ---
CATEGORIES_TICKETS = [
    {"nom": "Tableau de bord", "module": "dashboard", "icone": "LayoutDashboard"},
    {"nom": "Profil", "module": "profil", "icone": "User"},
    {"nom": "Rendez-vous", "module": "rendez_vous", "icone": "Calendar"},
    {"nom": "Prescriptions", "module": "prescriptions", "icone": "FileText"},
    {"nom": "Médicaments", "module": "medicaments", "icone": "Pill"},
    {"nom": "Dossier médical", "module": "dossier_medical", "icone": "FolderOpen"},
    {"nom": "Examens", "module": "examens", "icone": "FlaskConical"},
    {"nom": "Paiements", "module": "paiements", "icone": "CreditCard"},
    {"nom": "Notifications", "module": "notifications", "icone": "Bell"},
    {"nom": "Paramètres", "module": "parametres", "icone": "Settings"},
    {"nom": "Autre", "module": "autre", "icone": "HelpCircle"},
]


def _seed_categories_tickets():
    db = SessionLocal()
    try:
        existing = db.query(CategorieTicket).count()
        if existing == 0:
            for cat in CATEGORIES_TICKETS:
                db.add(CategorieTicket(**cat))
            db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()


@app.on_event("startup")
def start_scheduler():
    scheduler.start()


@app.on_event("startup")
def seed_categories():
    _seed_categories_tickets()


@app.on_event("shutdown")
def shutdown_scheduler():
    scheduler.shutdown()

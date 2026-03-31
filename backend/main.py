from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import settings
from routers.root import router as root_router

app = FastAPI(title='Nere_app API', version='1.0.0')

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if settings.CORS_ORIGINS != ['*'] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(root_router)

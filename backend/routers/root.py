from fastapi import APIRouter, Depends
from config import settings
from db import get_db

router = APIRouter()

@router.get("/", tags=["status"])
async def root():
    return {
        "message": "Nere_app backend OK",
        "environment": settings.ENVIRONMENT,
        "api_prefix": settings.API_PREFIX,
    }

@router.get("/health", tags=["status"])
async def health(db=Depends(get_db)):
    return {"status": "ok", "database": "connected"}

from fastapi import APIRouter, Depends, Request
from ..db import get_db
from ..config import settings

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


@router.get("/debug/request-state", tags=["debug"])
async def debug_request_state(request: Request):
    """Debug endpoint to verify middleware is setting request.state"""
    user = getattr(request.state, "user", None)
    user_id = getattr(request.state, "user_id", None)
    user_role = getattr(request.state, "user_role", None)

    return {
        "user_set": user is not None,
        "user_email": user.email if user else None,
        "user_id": user_id,
        "user_role": user_role,
        "auth_header": request.headers.get("Authorization") is not None,
    }

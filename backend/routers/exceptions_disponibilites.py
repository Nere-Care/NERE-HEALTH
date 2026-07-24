from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import ExceptionDisponibilite, User
from schemas import (
    ExceptionDisponibiliteCreate,
    ExceptionDisponibiliteRead,
    ExceptionDisponibiliteUpdate,
)

router = APIRouter(tags=["exceptions_disponibilites"])


@router.get(
    "/exceptions-disponibilites",
    response_model=List[ExceptionDisponibiliteRead],
)
async def list_exceptions(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role not in ("admin", "medecin", "infirmier", "sage_femme"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux professionnels",
        )

    stmt = select(ExceptionDisponibilite)
    if current_user.role in ("medecin", "infirmier", "sage_femme"):
        stmt = stmt.where(ExceptionDisponibilite.medecin_id == current_user.id)

    stmt = stmt.order_by(ExceptionDisponibilite.date.desc())
    exceptions = db.execute(stmt).scalars().all()
    return exceptions


@router.post(
    "/exceptions-disponibilites",
    response_model=ExceptionDisponibiliteRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_exception(
    exception_create: ExceptionDisponibiliteCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    if current_user.role == "medecin":
        exception_create.medecin_id = current_user.id

    if current_user.role == "admin" and not exception_create.medecin_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Médecin requis pour l'exception",
        )

    if not db.get(User, exception_create.medecin_id) or db.get(
        User, exception_create.medecin_id
    ).role != "medecin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Médecin introuvable",
        )

    existing = db.execute(
        select(ExceptionDisponibilite).where(
            ExceptionDisponibilite.medecin_id == exception_create.medecin_id,
            ExceptionDisponibilite.date == exception_create.date,
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Une exception existe déjà pour le {exception_create.date}",
        )

    exception = ExceptionDisponibilite(
        **exception_create.dict(exclude_unset=True)
    )
    db.add(exception)
    try:
        db.commit()
        db.refresh(exception)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur de création de l'exception",
        ) from exc
    return exception


@router.get(
    "/exceptions-disponibilites/{exception_id}",
    response_model=ExceptionDisponibiliteRead,
)
async def read_exception(
    exception_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    exception = db.get(ExceptionDisponibilite, exception_id)
    if not exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exception non trouvée",
        )
    if (
        current_user.role == "medecin"
        and exception.medecin_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé",
        )
    return exception


@router.put(
    "/exceptions-disponibilites/{exception_id}",
    response_model=ExceptionDisponibiliteRead,
)
async def update_exception(
    exception_id: UUID,
    exception_update: ExceptionDisponibiliteUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    exception = db.get(ExceptionDisponibilite, exception_id)
    if not exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exception non trouvée",
        )
    if (
        current_user.role == "medecin"
        and exception.medecin_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé",
        )

    if exception_update.date is not None:
        dup = db.execute(
            select(ExceptionDisponibilite).where(
                ExceptionDisponibilite.medecin_id == exception.medecin_id,
                ExceptionDisponibilite.date == exception_update.date,
                ExceptionDisponibilite.id != exception_id,
            )
        ).scalar_one_or_none()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Une exception existe déjà pour le {exception_update.date}",
            )

    for field, value in exception_update.dict(exclude_unset=True).items():
        setattr(exception, field, value)

    db.add(exception)
    try:
        db.commit()
        db.refresh(exception)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur de mise à jour de l'exception",
        ) from exc
    return exception


@router.delete(
    "/exceptions-disponibilites/{exception_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_exception(
    exception_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    exception = db.get(ExceptionDisponibilite, exception_id)
    if not exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exception non trouvée",
        )
    if (
        current_user.role == "medecin"
        and exception.medecin_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé",
        )

    db.delete(exception)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)

"""Reusable dossier access control helper.

When a patient has ``acces_dossier == 'restreint'``, only medecins listed in
``professionnels_autorises`` may access the patient's medical data.
Admins and the patient themselves always have access.

Usage::

    check_dossier_access(db, current_user, patient_id)  # raises 403 if denied
    get_dossier_access_level(db, current_user, patient_id)  # returns "full" or "restricted"
"""

from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models import Patient, ProfessionnelAutorise, User


def _has_access(db: Session, user: "User", patient: Patient) -> bool:
    """Internal: check if *user* has full access to *patient*'s dossier."""
    if user.role == "admin":
        return True
    if user.id == patient.id:
        return True
    if patient.acces_dossier != "restreint":
        return True

    from models import Medecin
    medecin = db.get(Medecin, user.id)
    if not medecin:
        return True  # not a medecin — let the caller handle role checks

    is_autorise = (
        db.query(ProfessionnelAutorise)
        .filter(
            ProfessionnelAutorise.patient_id == patient.id,
            ProfessionnelAutorise.medecin_id == medecin.id,
        )
        .first()
    )
    return bool(is_autorise)


def get_dossier_access_level(
    db: Session,
    current_user: "User",
    patient_id: UUID,
) -> str:
    """Return ``"full"`` or ``"restricted"`` for the given user/patient pair.

    Does **not** raise — the caller decides what to do with the result.
    """
    patient = db.get(Patient, patient_id)
    if not patient:
        return "full"  # let the caller handle 404
    if _has_access(db, current_user, patient):
        return "full"
    return "restricted"


def check_dossier_access(
    db: Session,
    current_user: "User",
    patient_id: UUID,
) -> bool:
    """Return True if *current_user* may access *patient_id*'s dossier.

    Raises ``HTTPException(403)`` when access is denied.
    """
    patient = db.get(Patient, patient_id)
    if not patient:
        return True  # patient not found — let the caller handle 404
    if _has_access(db, current_user, patient):
        return True
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Accès refusé. Ce patient a restreint l'accès à son dossier aux professionnels explicitement autorisés.",
    )

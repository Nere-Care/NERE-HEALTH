from datetime import datetime
from uuid import UUID, uuid4
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..db import get_db
from ..limiter import api_limiter
from ..models import RendezVous
from ..schemas import (
    TeleconsultationPrepareRequest,
    TeleconsultationPrepareResponse,
    TeleconsultationSignalRequest,
)

router = APIRouter(tags=["teleconsultation"])


@router.post(
    "/teleconsultation/prepare",
    response_model=TeleconsultationPrepareResponse,
    status_code=status.HTTP_201_CREATED,
)
@api_limiter.limit("5/minute")  # Téléconsultation: 5 préparations/minute
async def prepare_teleconsultation(
    request: Request,
    payload: TeleconsultationPrepareRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    rendez_vous = db.get(RendezVous, payload.rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")

    if current_user.role == "medecin" and rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if rendez_vous.type not in ("video", "audio"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La téléconsultation n'est possible que pour les rendez-vous vidéo ou audio",
        )

    if not rendez_vous.webrtc_room_id:
        room_id = f"nere-{uuid4().hex}"
        rendez_vous.webrtc_room_id = room_id
        rendez_vous.token_patient = secrets.token_urlsafe(48)
        rendez_vous.token_medecin = secrets.token_urlsafe(48)
        rendez_vous.lien_video = f"https://nere.app/teleconsultation/{room_id}"
        rendez_vous.updated_at = datetime.utcnow()
        db.add(rendez_vous)
        db.commit()
        db.refresh(rendez_vous)

    return TeleconsultationPrepareResponse(
        rendez_vous_id=rendez_vous.id,
        webrtc_room_id=rendez_vous.webrtc_room_id,
        lien_video=rendez_vous.lien_video,
        token_patient=rendez_vous.token_patient,
        token_medecin=rendez_vous.token_medecin,
        type=rendez_vous.type,
    )


@router.get("/teleconsultation/{rendez_vous_id}", response_model=TeleconsultationPrepareResponse)
@api_limiter.limit("20/minute")  # Lecture téléconsultation: 20/minute
async def get_teleconsultation(
    request: Request,
    rendez_vous_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")

    if current_user.role == "medecin" and rendez_vous.medecin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role == "patient" and rendez_vous.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if not rendez_vous.webrtc_room_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Aucune salle de téléconsultation associée")

    return TeleconsultationPrepareResponse(
        rendez_vous_id=rendez_vous.id,
        webrtc_room_id=rendez_vous.webrtc_room_id,
        lien_video=rendez_vous.lien_video,
        token_patient=rendez_vous.token_patient,
        token_medecin=rendez_vous.token_medecin,
        type=rendez_vous.type,
    )


@router.post("/teleconsultation/{rendez_vous_id}/signal")
@api_limiter.limit("50/minute")  # Signaux WebRTC: 50/minute (fréquents mais limités)
async def send_teleconsultation_signal(
    request: Request,
    rendez_vous_id: UUID,
    signal_payload: TeleconsultationSignalRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    rendez_vous = db.get(RendezVous, rendez_vous_id)
    if not rendez_vous:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rendez-vous non trouvé")

    if not rendez_vous.webrtc_room_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="La salle de téléconsultation n'est pas initialisée"
        )

    if current_user.role == "medecin" and rendez_vous.medecin_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé"
        )
    if current_user.role == "patient" and rendez_vous.patient_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé"
        )

    return {
        "detail": "Signaling accepted",
        "room_id": rendez_vous.webrtc_room_id,
        "signal_received": True,
    }

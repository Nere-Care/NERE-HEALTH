from decimal import Decimal
from uuid import UUID
from typing import Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from ..auth import get_current_active_user, require_role
from ..config import settings
from ..db import get_db
from ..limiter import api_limiter
from ..models import ChatbotSession, Patient, RendezVous, User
from ..schemas import IADiagnosticRequest, IADiagnosticResponse

router = APIRouter(tags=["ia"])


def _estimate_urgency(symptoms: List[str]) -> str:
    urgent_keywords = ["douleur", "fièvre", "saignement", "respiration", "étourdissements", "choc"]
    lower = " ".join(symptoms).lower()
    if any(keyword in lower for keyword in urgent_keywords):
        return "eleve"
    return "faible"


def _suggest_specialty(symptoms: List[str]) -> str:
    lower = " ".join(symptoms).lower()
    if "douleur" in lower and "thorax" in lower:
        return "cardiologue"
    if "peau" in lower or "érythème" in lower or "rash" in lower:
        return "dermatologue"
    if "fièvre" in lower or "toux" in lower:
        return "médecin généraliste"
    if "douleur" in lower and "articulation" in lower:
        return "rhumatologue"
    return "médecin généraliste"


def _build_prompt(payload: IADiagnosticRequest) -> List[Dict[str, str]]:
    prompt = [
        {
            "role": "system",
            "content": (
                "Vous êtes un assistant médical qui analyse des symptômes du patient et "
                "propose une spécialité appropriée, un niveau d'urgence et une synthèse concise."
            ),
        }
    ]
    prompt.append(
        {
            "role": "user",
            "content": (
                f"Patient: {payload.patient_id}\n"
                f"Symptômes: {', '.join(payload.symptomes_declares)}\n"
                f"Contexte: {payload.contexte or 'non spécifié'}"
            ),
        }
    )
    if payload.messages:
        for message in payload.messages:
            prompt.append(
                {"role": message.get("role", "user"), "content": message.get("content", "")}
            )
    return prompt


@router.post("/ia/diagnostic", response_model=IADiagnosticResponse)
@api_limiter.limit("10/minute")  # IA coûteuse: 10 diagnostics/minute
async def create_diagnostic(
    request: Request,
    payload: IADiagnosticRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role == "patient" and current_user.id != payload.patient_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if not db.get(Patient, payload.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    if payload.rdv_id and not db.get(RendezVous, payload.rdv_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rendez-vous introuvable")

    openai.api_key = settings.OPENAI_API_KEY
    analysis = None

    if settings.OPENAI_API_KEY:
        try:
            import openai

            openai.api_key = settings.OPENAI_API_KEY
            completion = openai.ChatCompletion.create(
                model=settings.OPENAI_MODEL,
                messages=_build_prompt(payload),
                max_tokens=250,
                temperature=0.5,
            )
            analysis = completion.choices[0].message.content.strip()
        except Exception as exc:
            analysis = (
                "Impossible d'interroger l'IA pour le moment. "
                "Veuillez réessayer ultérieurement."
            )
    else:
        analysis = (
            "Aucune clé OpenAI configurée. Analyse basique effectuée en local : "
            f"symptômes reçus = {', '.join(payload.symptomes_declares)}."
        )

    niveau_urgence = _estimate_urgency(payload.symptomes_declares)
    specialite = _suggest_specialty(payload.symptomes_declares)

    chatbot_session = ChatbotSession(
        patient_id=payload.patient_id,
        messages=payload.messages or [],
        symptomes_detectes=payload.symptomes_declares,
        specialite_suggeree=specialite,
        niveau_urgence=niveau_urgence,
        redirection_rdv=bool(payload.rdv_id),
        rdv_cree_id=payload.rdv_id,
        modele_ia=settings.OPENAI_MODEL,
        tokens_utilises=0,
        cout_estime_usd=Decimal("0"),
        statut="active",
    )
    db.add(chatbot_session)
    db.commit()
    db.refresh(chatbot_session)

    return IADiagnosticResponse(
        session_id=chatbot_session.id,
        analyse=analysis,
        specialite_suggeree=specialite,
        niveau_urgence=niveau_urgence,
        rdv_recommande=payload.rdv_id,
        modele_ia=settings.OPENAI_MODEL,
        cout_estime_usd=chatbot_session.cout_estime_usd,
    )

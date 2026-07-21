from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import select

from auth import get_current_active_user
from db import get_db
from models import ChatbotSession, Specialite, Medecin, User, MedecinSpecialite

router = APIRouter(tags=["symptomes"])


# ── Base de correspondance symptomes -> specialite (mots-cles) ──────────────
MAPPING_SYMPTOMES = {
    "Cardiologie": [
        "douleur poitrine", "douleur thoracique", "palpitations", "essoufflement",
        "coeur", "tension", "hypertension", "vertiges", "fatigue cardiaque",
    ],
    "Pédiatrie": [
        "enfant", "bebe", "nourrisson", "fievre enfant", "vaccination enfant",
        "croissance", "pediatrie",
    ],
    "Gynécologie": [
        "grossesse", "regles", "menstruation", "douleur pelvienne", "gynecologie",
        "contraception", "menopause",
    ],
    "Dermatologie": [
        "peau", "eruption", "demangeaison", "bouton", "acne", "eczema",
        "psoriasis", "grain de beaute", "allergie cutanee",
    ],
    "Ophtalmologie": [
        "oeil", "yeux", "vision", "vue", "douleur oculaire", "vue floue",
        "conjonctivite",
    ],
    "Orthopédie": [
        "articulation", "fracture", "dos", "genou", "epaule", "entorse",
        "douleur musculaire", "colonne vertebrale",
    ],
    "Neurologie": [
        "migraine", "mal de tete", "vertige", "engourdissement", "tremblement",
        "perte de memoire", "convulsion",
    ],
}

NIVEAUX_URGENCE_MOTS = {
    "eleve": ["douleur intense", "sang", "difficulte respirer", "perte de conscience", "urgence"],
    "moyen": ["douleur", "fievre", "vomissement"],
}


class SymptomeRequest(BaseModel):
    symptomes: str


class SymptomeResponse(BaseModel):
    specialite_recommandee: str
    specialite_id: Optional[str] = None
    niveau_urgence: str
    explication: str
    medecins_disponibles: List[dict]


def analyser_texte(texte: str) -> tuple[str, str]:
    texte_lower = texte.lower()

    scores = {}
    for specialite, mots_cles in MAPPING_SYMPTOMES.items():
        score = sum(1 for mot in mots_cles if mot in texte_lower)
        if score > 0:
            scores[specialite] = score

    specialite_recommandee = max(scores, key=scores.get) if scores else "Médecine Générale"

    niveau_urgence = "faible"
    for niveau, mots in NIVEAUX_URGENCE_MOTS.items():
        if any(mot in texte_lower for mot in mots):
            niveau_urgence = niveau
            break

    return specialite_recommandee, niveau_urgence


@router.post("/symptomes/analyser", response_model=SymptomeResponse)
async def analyser_symptomes(
    payload: SymptomeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "patient":
        raise HTTPException(403, "Reserve aux patients")

    if not payload.symptomes.strip():
        raise HTTPException(400, "Veuillez decrire vos symptomes")

    specialite_recommandee, niveau_urgence = analyser_texte(payload.symptomes)

    # Recuperer l'id de la specialite en DB
    specialite_obj = db.query(Specialite).filter(
        Specialite.libelle_fr == specialite_recommandee
    ).first()

    # Recuperer les medecins disponibles pour cette specialite
    medecins_disponibles = []
    if specialite_obj:
        rows = db.execute(
            select(Medecin, User)
            .join(User, Medecin.id == User.id)
            .join(MedecinSpecialite, MedecinSpecialite.medecin_id == Medecin.id)
            .where(MedecinSpecialite.specialite_id == specialite_obj.id)
            .where(Medecin.disponible_maintenant == True)
            .limit(3)
        ).all()

        medecins_disponibles = [
            {
                "id": str(m.id),
                "nom": f"Dr. {u.prenom} {u.nom}",
                "tarif": float(m.tarif_consultation or 0),
                "devise": m.devise or "XAF",
                "note": float(m.note_moyenne or 0),
                "teleconsultation": bool(m.teleconsultation_active),
            }
            for m, u in rows
        ]

    explications = {
        "Cardiologie": "Vos symptomes evoquent une possible origine cardiaque. Une consultation en cardiologie est recommandee.",
        "Pédiatrie": "Ces symptomes concernent un enfant. Une consultation pediatrique est recommandee.",
        "Gynécologie": "Vos symptomes relevent du domaine gynecologique.",
        "Dermatologie": "Ces symptomes touchent la peau. Un dermatologue pourra mieux vous aider.",
        "Ophtalmologie": "Vos symptomes concernent la vue. Une consultation ophtalmologique est conseillee.",
        "Orthopédie": "Ces symptomes evoquent un probleme articulaire ou osseux.",
        "Neurologie": "Vos symptomes peuvent relever du domaine neurologique.",
        "Médecine Générale": "Un medecin generaliste pourra evaluer vos symptomes et vous orienter si necessaire.",
    }

    # Sauvegarder la session pour l'historique / analytics
    session = ChatbotSession(
        patient_id=current_user.id,
        messages=[{"role": "user", "content": payload.symptomes}],
        symptomes_detectes=[payload.symptomes],
        specialite_suggeree=specialite_recommandee,
        niveau_urgence=niveau_urgence,
        statut="terminee",
    )
    db.add(session)
    db.commit()

    return {
        "specialite_recommandee": specialite_recommandee,
        "specialite_id": str(specialite_obj.id) if specialite_obj else None,
        "niveau_urgence": niveau_urgence,
        "explication": explications.get(specialite_recommandee, ""),
        "medecins_disponibles": medecins_disponibles,
    }
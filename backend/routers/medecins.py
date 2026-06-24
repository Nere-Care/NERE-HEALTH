from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Medecin, User
from schemas import MedecinCreate, MedecinRead

from models import Medecin, User, MedecinSpecialite, Specialite, Structure

router = APIRouter(tags=["medecins"])


@router.get("/medecins", response_model=List[MedecinRead])
async def list_medecins(
    current_user=Depends(get_current_active_user),
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
):
    if current_user.role == "medecin":
        stmt = select(Medecin).where(Medecin.id == current_user.id)
    elif current_user.role == "admin":
        stmt = select(Medecin).limit(limit)
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")

    medecins = db.execute(stmt).scalars().all()
    return medecins


@router.post("/medecins", response_model=MedecinRead, status_code=status.HTTP_201_CREATED)
async def create_medecin(
    medecin_create: MedecinCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    user = db.get(User, medecin_create.id)
    if not user or user.role != "medecin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Utilisateur médecin introuvable")

    medecin = Medecin(**medecin_create.dict(exclude_unset=True))
    db.add(medecin)
    try:
        db.commit()
        db.refresh(medecin)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création du médecin") from exc
    return medecin


@router.get("/medecins/{medecin_id}", response_model=MedecinRead)
async def read_medecin(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    if current_user.role == "medecin" and medecin.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux professionnels")
    return medecin


@router.put("/medecins/{medecin_id}", response_model=MedecinRead)
async def update_medecin(
    medecin_id: UUID,
    medecin_update: MedecinCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    if current_user.role == "medecin" and medecin.id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    if current_user.role not in ("admin", "medecin"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Permission insuffisante")

    for field, value in medecin_update.dict(exclude_unset=True).items():
        setattr(medecin, field, value)

    db.add(medecin)
    try:
        db.commit()
        db.refresh(medecin)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour du médecin: {exc.orig}") from exc
    return medecin


@router.delete("/medecins/{medecin_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_medecin(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Médecin non trouvé")
    db.delete(medecin)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)



@router.get("/annuaire/medecins")
async def annuaire_medecins(
    search: Optional[str] = Query(None),
    specialite: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = (
        select(Medecin, User)
        .join(User, Medecin.id == User.id)
        .where(User.statut == "actif")
    )

    if search:
        stmt = stmt.where(
            (User.nom.ilike(f"%{search}%")) |
            (User.prenom.ilike(f"%{search}%"))
        )

    rows = db.execute(stmt).all()

    result = []
    for medecin, user in rows:
        specs = (
            db.query(Specialite)
            .join(MedecinSpecialite, Specialite.id == MedecinSpecialite.specialite_id)
            .filter(MedecinSpecialite.medecin_id == medecin.id)
            .all()
        )
        specialites_labels = [s.libelle_fr for s in specs]

        if specialite and specialite != "Toutes":
            if specialite not in specialites_labels:
                continue

        # Lieu d'exercice via structure
        lieu_exercice = "Cabinet indépendant"
        if medecin.structure_id:
            structure = db.get(Structure, medecin.structure_id)
            if structure:
                lieu_exercice = structure.nom_etablissement

        result.append({
            "id": str(medecin.id),
            "nom": f"Dr. {user.prenom} {user.nom}",
            "specialite": specialites_labels[0] if specialites_labels else "Médecine Générale",
            "specialites": specialites_labels,
            "note": float(medecin.note_moyenne or 0),
            "experience": f"{medecin.annees_experience or 0} ans",
            "disponible": bool(medecin.disponible_maintenant),
            "tarif": float(medecin.tarif_consultation or 5000),
            "devise": medecin.devise or "XAF",
            "teleconsultation": bool(medecin.teleconsultation_active),
            "biographie": medecin.biographie or "",
            "langues": medecin.langues_parlees or [],
            "statut_verification": medecin.statut_verification,
            "lieu_exercice": lieu_exercice,
        })

    return result


@router.get("/annuaire/medecins/{medecin_id}")
async def profil_medecin(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        raise HTTPException(status_code=404, detail="Médecin non trouvé")

    user = db.get(User, medecin_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Spécialités
    specs = (
        db.query(Specialite)
        .join(MedecinSpecialite, Specialite.id == MedecinSpecialite.specialite_id)
        .filter(MedecinSpecialite.medecin_id == medecin.id)
        .all()
    )

    # Structure
    lieu_exercice = "Cabinet indépendant"
    ville = ""
    if medecin.structure_id:
        structure = db.get(Structure, medecin.structure_id)
        if structure:
            lieu_exercice = structure.nom_etablissement
            ville = structure.ville or ""

    # Avis vérifiés
    from models import Avis
    avis_list = (
        db.query(Avis, User)
        .join(User, Avis.patient_id == User.id)
        .filter(Avis.medecin_id == medecin.id, Avis.verifie == True, Avis.masque == False)
        .order_by(Avis.created_at.desc())
        .limit(10)
        .all()
    )

    # Disponibilités
    from models import Disponibilite
    dispos = (
        db.query(Disponibilite)
        .filter(Disponibilite.medecin_id == medecin.id, Disponibilite.actif == True)
        .all()
    )

    return {
        "id": str(medecin.id),
        "nom": f"Dr. {user.prenom} {user.nom}",
        "specialite": specs[0].libelle_fr if specs else "Médecine Générale",
        "specialites": [s.libelle_fr for s in specs],
        "note": float(medecin.note_moyenne or 0),
        "nombre_avis": medecin.nombre_avis or 0,
        "experience": f"{medecin.annees_experience or 0} ans",
        "disponible": bool(medecin.disponible_maintenant),
        "tarif": float(medecin.tarif_consultation or 5000),
        "devise": medecin.devise or "XAF",
        "teleconsultation": bool(medecin.teleconsultation_active),
        "biographie": medecin.biographie or "",
        "langues": medecin.langues_parlees or [],
        "lieu_exercice": lieu_exercice,
        "ville": ville,
        "statut_verification": medecin.statut_verification,
        "avis": [
            {
                "nom": f"{u.prenom} {u.nom[0]}.",
                "note": a.note,
                "commentaire": a.commentaire or "",
                "date": a.created_at.strftime("%d/%m/%Y"),
                "reponse_medecin": a.reponse_medecin or None,
            }
            for a, u in avis_list
        ],
        "disponibilites": [
            {
                "jour": d.jour_semaine,
                "heure_debut": str(d.heure_debut),
                "heure_fin": str(d.heure_fin),
                "type": d.type,
                "duree_minutes": d.duree_creneau_minutes or 30,
            }
            for d in dispos
        ],
    }
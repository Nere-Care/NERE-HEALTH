from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status, UploadFile, File
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Medecin, User
from schemas import MedecinCreate, MedecinRead

import base64

from datetime import datetime, timezone, date, timedelta


from models import Medecin, User, MedecinSpecialite, Specialite, Structure, RendezVous, Paiement, Notification, Patient, Disponibilite


from sqlalchemy import select, func, extract, or_
from auth import get_current_active_user




from pydantic import BaseModel as PydanticBase


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
            "photo_url": medecin.photo_url,
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
        "photo_url": medecin.photo_url,
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











@router.get("/medecin/dashboard")
async def medecin_dashboard(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    today = date.today()
    debut_semaine = today - timedelta(days=today.weekday())
    debut_mois = today.replace(day=1)
    hier = today - timedelta(days=1)

    # --- STATS CARTES ---
    total_patients = db.execute(
        select(func.count(func.distinct(RendezVous.patient_id)))
        .where(RendezVous.medecin_id == current_user.id)
    ).scalar() or 0

    patients_hier = db.execute(
        select(func.count(func.distinct(RendezVous.patient_id)))
        .where(
            RendezVous.medecin_id == current_user.id,
            func.date(RendezVous.date_heure_debut) == hier,
        )
    ).scalar() or 0

    rdv_today = db.execute(
        select(func.count(RendezVous.id))
        .where(
            RendezVous.medecin_id == current_user.id,
            func.date(RendezVous.date_heure_debut) == today,
        )
    ).scalar() or 0

    rdv_hier = db.execute(
        select(func.count(RendezVous.id))
        .where(
            RendezVous.medecin_id == current_user.id,
            func.date(RendezVous.date_heure_debut) == hier,
        )
    ).scalar() or 0

    consultations_semaine = db.execute(
        select(func.count(RendezVous.id))
        .where(
            RendezVous.medecin_id == current_user.id,
            RendezVous.statut == "termine",
            func.date(RendezVous.date_heure_debut) >= debut_semaine,
        )
    ).scalar() or 0

    consultations_semaine_precedente = db.execute(
        select(func.count(RendezVous.id))
        .where(
            RendezVous.medecin_id == current_user.id,
            RendezVous.statut == "termine",
            func.date(RendezVous.date_heure_debut) >= debut_semaine - timedelta(days=7),
            func.date(RendezVous.date_heure_debut) < debut_semaine,
        )
    ).scalar() or 0

    revenus_mois = db.execute(
        select(func.sum(Paiement.montant_total - func.coalesce(Paiement.frais_plateforme, 0)))
        .where(
            Paiement.medecin_id == current_user.id,
            Paiement.statut == "confirme",
            func.date(Paiement.created_at) >= debut_mois,
        )
    ).scalar() or 0

    revenus_mois_precedent = db.execute(
        select(func.sum(Paiement.montant_total - func.coalesce(Paiement.frais_plateforme, 0)))
        .where(
            Paiement.medecin_id == current_user.id,
            Paiement.statut == "confirme",
            func.date(Paiement.created_at) >= (debut_mois - timedelta(days=30)).replace(day=1),
            func.date(Paiement.created_at) < debut_mois,
        )
    ).scalar() or 0

    def growth(current, previous):
        if previous == 0:
            return "+100%" if current > 0 else "0%"
        pct = ((current - previous) / previous) * 100
        return f"+{pct:.0f}%" if pct >= 0 else f"{pct:.0f}%"

    stats = [
        {
            "title": "Total Patients",
            "value": str(total_patients),
            "subtitle": "Patients suivis",
            "growth": growth(total_patients, patients_hier),
            "color": "green",
        },
        {
            "title": "Appointments Today",
            "value": str(rdv_today),
            "subtitle": "Rendez-vous du jour",
            "growth": growth(rdv_today, rdv_hier),
            "color": "blue",
        },
        {
            "title": "Consultations",
            "value": str(consultations_semaine),
            "subtitle": "Cette semaine",
            "growth": growth(consultations_semaine, consultations_semaine_precedente),
            "color": "purple",
        },
        {
            "title": "Revenue",
            "value": f"{int(revenus_mois):,} XAF",
            "subtitle": "Ce mois",
            "growth": growth(float(revenus_mois), float(revenus_mois_precedent)),
            "color": "orange",
        },
    ]

    # --- RDV DU JOUR ---
    rows_today = db.execute(
        select(RendezVous, User)
        .join(User, RendezVous.patient_id == User.id)
        .where(
            RendezVous.medecin_id == current_user.id,
            func.date(RendezVous.date_heure_debut) == today,
        )
        .order_by(RendezVous.date_heure_debut.asc())
        .limit(10)
    ).all()

    from models import Structure
    medecin_profil = db.get(Medecin, current_user.id)
    structure_nom = "Cabinet"
    if medecin_profil and medecin_profil.structure_id:
        struct = db.get(Structure, medecin_profil.structure_id)
        if struct:
            structure_nom = struct.nom_etablissement

    rdv_du_jour = [
        {
            "id": str(r.id),
            "patient": f"{u.prenom} {u.nom}",
            "time": r.date_heure_debut.strftime("%H:%M"),
            "type": "Teleconsultation" if r.type == "video" else "Consultation",
            "clinic": structure_nom,
            "reason": r.motif_consultation or "Consultation",
            "statut": r.statut,
        }
        for r, u in rows_today
    ]

    # --- ✅ PATIENTS RECENTS (CORRIGÉ) ---
    # Sous-requête : dernier RDV par patient
    subq = (
        db.query(
            RendezVous.patient_id,
            func.max(RendezVous.date_heure_debut).label('derniere_visite')
        )
        .filter(RendezVous.medecin_id == current_user.id)
        .group_by(RendezVous.patient_id)
        .order_by(func.max(RendezVous.date_heure_debut).desc())
        .limit(5)
        .subquery()
    )

    # Jointure avec User pour avoir les infos patient
    rows_patients = db.execute(
        select(User, subq.c.derniere_visite)
        .join(subq, User.id == subq.c.patient_id)
    ).all()

    patients_recents = []
    for u, derniere_visite in rows_patients:
        patient = db.get(Patient, u.id)
        age = None
        if patient and patient.date_naissance:
            age = today.year - patient.date_naissance.year - (
                (today.month, today.day) < (patient.date_naissance.month, patient.date_naissance.day)
            )
        patients_recents.append({
            "id": str(u.id),
            "name": f"{u.prenom} {u.nom}",
            "age": age,
            "derniere_visite": derniere_visite.strftime("%d/%m/%Y") if derniere_visite else None,
        })

    # --- REVENUS HEBDO (7 derniers jours) ---
    revenus_hebdo = []
    for i in range(6, -1, -1):
        jour = today - timedelta(days=i)
        montant = db.execute(
            select(func.sum(Paiement.montant_total - func.coalesce(Paiement.frais_plateforme, 0)))
            .where(
                Paiement.medecin_id == current_user.id,
                Paiement.statut == "confirme",
                func.date(Paiement.created_at) == jour,
            )
        ).scalar() or 0
        revenus_hebdo.append({
            "day": jour.strftime("%a"),
            "amount": float(montant),
        })

    # --- CONSULTATIONS PAR MOIS (6 derniers mois) ---
    consultations_mensuelles = []
    for i in range(5, -1, -1):
        mois_cible = (debut_mois - timedelta(days=30 * i))
        nb = db.execute(
            select(func.count(RendezVous.id))
            .where(
                RendezVous.medecin_id == current_user.id,
                extract("year", RendezVous.date_heure_debut) == mois_cible.year,
                extract("month", RendezVous.date_heure_debut) == mois_cible.month,
            )
        ).scalar() or 0
        consultations_mensuelles.append({
            "month": mois_cible.strftime("%b"),
            "total": nb,
        })

    # --- NOTIFICATIONS ---
    notifs = db.execute(
        select(Notification)
        .where(
            Notification.utilisateur_id == current_user.id,
            Notification.statut != "lu",
        )
        .order_by(Notification.created_at.desc())
        .limit(5)
    ).scalars().all()

    notifications_data = [
        {
            "id": str(n.id),
            "titre": n.titre,
            "contenu": n.contenu,
            "type": n.type,
            "created_at": n.created_at.strftime("%H:%M") if n.created_at else "",
        }
        for n in notifs
    ]

    return {
        "stats": stats,
        "rdv_du_jour": rdv_du_jour,
        "patients_recents": patients_recents,
        "revenus_hebdo": revenus_hebdo,
        "consultations_mensuelles": consultations_mensuelles,
        "notifications": notifications_data,
    }







from pydantic import BaseModel as PydanticBase
from typing import Optional, List

class MedecinProfilUpdate(PydanticBase):
    biographie: Optional[str] = None
    tarif_consultation: Optional[float] = None
    devise: Optional[str] = None
    langues_parlees: Optional[List[str]] = None
    teleconsultation_active: Optional[bool] = None
    disponible_maintenant: Optional[bool] = None
    telephone_pro: Optional[str] = None
    annees_experience: Optional[int] = None


@router.get("/medecin/mon-profil")
async def get_mon_profil(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    medecin = db.get(Medecin, current_user.id)
    if not medecin:
        raise HTTPException(404, "Profil medecin introuvable")

    # Spécialités
    from models import MedecinSpecialite, Specialite
    specs = db.query(Specialite).join(
        MedecinSpecialite, Specialite.id == MedecinSpecialite.specialite_id
    ).filter(MedecinSpecialite.medecin_id == current_user.id).all()

    # Structure
    structure_nom = ""
    if medecin.structure_id:
        struct = db.get(Structure, medecin.structure_id)
        if struct:
            structure_nom = struct.nom_etablissement

    return {
        "id": str(current_user.id),
        "prenom": current_user.prenom or "",
        "nom": current_user.nom or "",
        "email": current_user.email or "",
        "telephone": current_user.telephone or "",
        "role": current_user.role,
        "statut_verification": medecin.statut_verification or "en_attente",
        "numero_ordre": medecin.numero_ordre or "",
        "biographie": medecin.biographie or "",
        "tarif_consultation": float(medecin.tarif_consultation or 0),
        "devise": medecin.devise or "XAF",
        "langues_parlees": medecin.langues_parlees or [],
        "teleconsultation_active": bool(medecin.teleconsultation_active),
        "disponible_maintenant": bool(medecin.disponible_maintenant),
        "annees_experience": medecin.annees_experience or 0,
        "note_moyenne": float(medecin.note_moyenne or 0),
        "specialites": [s.libelle_fr for s in specs],
        "lieu_exercice": structure_nom,
        "photo_url": medecin.photo_url,

    }


@router.put("/medecin/mon-profil")
async def update_mon_profil(
    payload: MedecinProfilUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    medecin = db.get(Medecin, current_user.id)
    if not medecin:
        raise HTTPException(404, "Profil medecin introuvable")

    if payload.biographie is not None:
        medecin.biographie = payload.biographie
    if payload.tarif_consultation is not None:
        if payload.tarif_consultation < 0:
            raise HTTPException(400, "Le tarif ne peut pas etre negatif")
        medecin.tarif_consultation = payload.tarif_consultation
    if payload.devise is not None:
        medecin.devise = payload.devise
    if payload.langues_parlees is not None:
        medecin.langues_parlees = payload.langues_parlees
    if payload.teleconsultation_active is not None:
        medecin.teleconsultation_active = payload.teleconsultation_active
    if payload.disponible_maintenant is not None:
        medecin.disponible_maintenant = payload.disponible_maintenant
    if payload.annees_experience is not None:
        if payload.annees_experience < 0 or payload.annees_experience > 60:
            raise HTTPException(400, "Annees d'experience invalides")
        medecin.annees_experience = payload.annees_experience
    if payload.telephone_pro is not None:
        current_user.telephone = payload.telephone_pro
    

    db.commit()
    return {"message": "Profil mis a jour avec succes"}














class DisponibiliteCreate(PydanticBase):
    jour_semaine: str
    heure_debut: str
    heure_fin: str
    duree_creneau_minutes: int = 30
    type: str = "presentiel"
    recurrence: str = "hebdomadaire"

class DisponibiliteUpdate(PydanticBase):
    disponibilites: List[DisponibiliteCreate]


@router.get("/medecin/disponibilites")
async def get_mes_disponibilites(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    dispos = db.query(Disponibilite).filter(
        Disponibilite.medecin_id == current_user.id,
        Disponibilite.actif == True,
    ).order_by(Disponibilite.jour_semaine).all()

    return [
        {
            "id": str(d.id),
            "jour_semaine": d.jour_semaine,
            "heure_debut": d.heure_debut,
            "heure_fin": d.heure_fin,
            "duree_creneau_minutes": d.duree_creneau_minutes,
            "type": d.type,
            "recurrence": d.recurrence or "hebdomadaire",
            "actif": d.actif,
        }
        for d in dispos
    ]


@router.put("/medecin/disponibilites")
async def update_mes_disponibilites(
    payload: DisponibiliteUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Réservé aux médecins")

    import re
    # ✅ Accepter HH:MM ou HH:MM:SS
    heure_regex = re.compile(r"^\d{2}:\d{2}(:\d{2})?$")
    jours_valides = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]

    erreurs = []
    for i, d in enumerate(payload.disponibilites):
        jour = str(d.jour_semaine).lower().strip()
        if jour not in jours_valides:
            erreurs.append(f"Disponibilité {i+1}: Jour invalide '{d.jour_semaine}'")
        
        # ✅ Normaliser les heures (enlever les secondes si présentes)
        h_debut = str(d.heure_debut).strip()[:5]  # Garde seulement HH:MM
        h_fin = str(d.heure_fin).strip()[:5]
        
        if not re.match(r"^\d{2}:\d{2}$", h_debut) or not re.match(r"^\d{2}:\d{2}$", h_fin):
            erreurs.append(f"Disponibilité {i+1}: Format heure invalide. Utilisez HH:MM (ex: 09:00)")
        elif h_debut >= h_fin:
            erreurs.append(f"Disponibilité {i+1}: L'heure de début ({h_debut}) doit être avant l'heure de fin ({h_fin})")
        
        type_norm = str(d.type).lower().strip().replace("é", "e")
        if type_norm not in ["video", "presentiel"]:
            erreurs.append(f"Disponibilité {i+1}: Type invalide '{d.type}'")
        
        if d.duree_creneau_minutes < 10 or d.duree_creneau_minutes > 180:
            erreurs.append(f"Disponibilité {i+1}: Durée invalide ({d.duree_creneau_minutes} min)")

    if erreurs:
        raise HTTPException(400, detail="; ".join(erreurs))

    # Désactiver les anciennes disponibilités
    db.query(Disponibilite).filter(
        Disponibilite.medecin_id == current_user.id,
    ).update({"actif": False})

    # Créer les nouvelles (avec heures normalisées)
    for d in payload.disponibilites:
        type_norm = str(d.type).lower().strip().replace("é", "e")
        nouvelle = Disponibilite(
            medecin_id=current_user.id,
            jour_semaine=str(d.jour_semaine).lower().strip(),
            heure_debut=str(d.heure_debut).strip()[:5],  # ✅ Normalisé
            heure_fin=str(d.heure_fin).strip()[:5],      # ✅ Normalisé
            duree_creneau_minutes=int(d.duree_creneau_minutes),
            type=type_norm,
            recurrence=str(d.recurrence or "hebdomadaire").lower().strip(),
            actif=True,
        )
        db.add(nouvelle)

    db.commit()
    return {"message": f"{len(payload.disponibilites)} disponibilité(s) sauvegardée(s)"}

@router.delete("/medecin/disponibilites/{dispo_id}")
async def supprimer_disponibilite(
    dispo_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    dispo = db.get(Disponibilite, dispo_id)
    if not dispo:
        raise HTTPException(404, "Disponibilite introuvable")
    if dispo.medecin_id != current_user.id:
        raise HTTPException(403, "Acces refuse")

    dispo.actif = False
    db.commit()
    return {"message": "Disponibilite supprimee"}









@router.post("/medecin/mon-profil/photo")
async def uploader_photo_profil(
    photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    ALLOWED_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if photo.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Format non supporte (JPG, PNG ou WEBP)")

    contenu = await photo.read()
    MAX_SIZE = 5 * 1024 * 1024
    if len(contenu) > MAX_SIZE:
        raise HTTPException(400, "Image trop volumineuse (max 5 MB)")

    medecin = db.get(Medecin, current_user.id)
    if not medecin:
        raise HTTPException(404, "Profil medecin introuvable")

    b64 = base64.b64encode(contenu).decode("utf-8")
    medecin.photo_url = f"data:{photo.content_type};base64,{b64}"

    db.commit()
    return {"message": "Photo mise a jour", "photo_url": medecin.photo_url}


@router.delete("/medecin/mon-profil/photo")
async def supprimer_photo_profil(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    medecin = db.get(Medecin, current_user.id)
    if not medecin:
        raise HTTPException(404, "Profil medecin introuvable")

    medecin.photo_url = None
    db.commit()
    return {"message": "Photo supprimee"}
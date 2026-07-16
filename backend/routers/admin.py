


from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone, date, timedelta

from auth import get_current_active_user
from db import get_db
from models import User, Patient, Medecin, RendezVous, MedecinSpecialite, Specialite, Structure




# ... (tes autres routes admin) ...



router = APIRouter(tags=["admin"])


def require_admin(current_user=Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(403, "Reserve aux administrateurs")
    return current_user


@router.get("/admin/patients")
async def admin_list_patients(
    search: Optional[str] = None,
    telephone: Optional[str] = None,
    sexe: Optional[str] = None,
    groupe_sanguin: Optional[str] = None,
    statut: Optional[str] = None,
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    stmt = select(User, Patient).join(Patient, Patient.id == User.id)

    if search:
        kw = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.prenom).like(kw),
                func.lower(User.nom).like(kw),
                func.lower(User.email).like(kw),
                func.lower(Patient.numero_patient).like(kw),
            )
        )
    if telephone:
        stmt = stmt.where(User.telephone.ilike(f"%{telephone}%"))
    if sexe and sexe in ("M", "F"):
        stmt = stmt.where(Patient.sexe == sexe)
    if groupe_sanguin:
        stmt = stmt.where(Patient.groupe_sanguin == groupe_sanguin)
    if statut:
        stmt = stmt.where(User.statut == statut)

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0
    rows = db.execute(stmt.order_by(User.created_at.desc()).limit(limit).offset(offset)).all()

    today = date.today()

    result = []
    for user, patient in rows:
        # Dernier RDV
        dernier_rdv = db.query(RendezVous).filter(
            RendezVous.patient_id == user.id
        ).order_by(RendezVous.date_heure_debut.desc()).first()

        # Calcul âge
        age = None
        if patient.date_naissance:
            age = today.year - patient.date_naissance.year - (
                (today.month, today.day) < (patient.date_naissance.month, patient.date_naissance.day)
            )

        # Dernière connexion
        derniere_connexion = "Jamais"
        if user.updated_at:
            diff = datetime.now(timezone.utc) - user.updated_at.replace(tzinfo=timezone.utc)
            if diff.days == 0:
                if diff.seconds < 3600:
                    derniere_connexion = f"Il y a {diff.seconds // 60} min"
                else:
                    derniere_connexion = f"Il y a {diff.seconds // 3600}h"
            elif diff.days == 1:
                derniere_connexion = "Hier"
            else:
                derniere_connexion = f"Il y a {diff.days} jours"

        result.append({
            "id": str(user.id),
            "nom": user.nom or "",
            "prenom": user.prenom or "",
            "email": user.email or "",
            "telephone": user.telephone or "",
            "statut": user.statut or "actif",
            "numero_patient": patient.numero_patient or "",
            "sexe": "Masculin" if patient.sexe == "M" else "Féminin" if patient.sexe == "F" else "N/A",
            "sexe_raw": patient.sexe or "",
            "date_naissance": patient.date_naissance.isoformat() if patient.date_naissance else None,
            "age": age,
            "groupe_sanguin": patient.groupe_sanguin or "N/A",
            "ville": patient.ville or "N/A",
            "pays": patient.pays or "CM",
            "allergies": ", ".join(patient.allergies) if patient.allergies else "Aucune",
            "allergies_list": patient.allergies or [],
            "antecedents": patient.antecedents_medicaux or "Aucun",
            "couverture": patient.couverture_assurance or "Non renseigné",
            "nb_rdv": db.query(func.count(RendezVous.id)).filter(RendezVous.patient_id == user.id).scalar() or 0,
            "dernier_rdv": dernier_rdv.date_heure_debut.strftime("%d/%m/%Y") if dernier_rdv else "Aucun",
            "derniereConnexion": derniere_connexion,
            "created_at": user.created_at.strftime("%d/%m/%Y") if user.created_at else "",
        })

    return {"patients": result, "total": total}


@router.get("/admin/patients/activite")
async def admin_activite_patients(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    depuis = datetime.now(timezone.utc) - timedelta(hours=24)

    # Nouvelles consultations
    nouvelles_consults = db.query(RendezVous).filter(
        RendezVous.created_at >= depuis,
    ).order_by(RendezVous.created_at.desc()).limit(10).all()

    result = []
    for rdv in nouvelles_consults:
        patient_user = db.get(User, rdv.patient_id)
        if not patient_user:
            continue
        diff = datetime.now(timezone.utc) - rdv.created_at.replace(tzinfo=timezone.utc)
        if diff.seconds < 3600:
            temps = f"Il y a {diff.seconds // 60} min"
        elif diff.days == 0:
            temps = f"Il y a {diff.seconds // 3600}h"
        else:
            temps = f"Il y a {diff.days} jour(s)"

        result.append({
            "id": str(rdv.id),
            "action": "Nouvelle consultation" if rdv.statut == "confirme" else "Demande de RDV",
            "patient": f"{patient_user.prenom} {patient_user.nom}",
            "time": temps,
        })

    # Nouveaux patients (inscrits dans les 24h)
    nouveaux_patients = db.query(User).join(Patient, Patient.id == User.id).filter(
        User.role == "patient",
        User.created_at >= depuis,
    ).order_by(User.created_at.desc()).limit(5).all()

    for user in nouveaux_patients:
        diff = datetime.now(timezone.utc) - user.created_at.replace(tzinfo=timezone.utc)
        temps = f"Il y a {diff.seconds // 60} min" if diff.seconds < 3600 else f"Il y a {diff.seconds // 3600}h"
        result.append({
            "id": str(user.id),
            "action": "Patient ajouté",
            "patient": f"{user.prenom} {user.nom}",
            "time": temps,
        })

    result.sort(key=lambda x: x["time"])
    return result[:10]


@router.get("/admin/stats/patients")
async def admin_stats_patients(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    today = date.today()

    total = db.execute(
        select(func.count(Patient.id))
    ).scalar() or 0

    actifs = db.execute(
        select(func.count(User.id))
        .join(Patient, Patient.id == User.id)
        .where(User.statut == "actif")
    ).scalar() or 0

    consultations_today = db.execute(
        select(func.count(RendezVous.id))
        .where(func.date(RendezVous.date_heure_debut) == today)
    ).scalar() or 0

    avec_allergies = db.execute(
        select(func.count(Patient.id))
        .where(Patient.allergies != None)
        .where(func.array_length(Patient.allergies, 1) > 0)
    ).scalar() or 0

    nouveaux_semaine = db.execute(
        select(func.count(User.id))
        .join(Patient, Patient.id == User.id)
        .where(User.role == "patient")
        .where(func.date(User.created_at) >= today - timedelta(days=7))
    ).scalar() or 0

    dossiers_incomplets = db.execute(
        select(func.count(Patient.id))
        .where(
            or_(
                Patient.date_naissance == None,
                Patient.sexe == None,
                Patient.groupe_sanguin == None,
            )
        )
    ).scalar() or 0

    return {
        "total": total,
        "actifs": actifs,
        "consultations_today": consultations_today,
        "avec_allergies": avec_allergies,
        "nouveaux_semaine": nouveaux_semaine,
        "dossiers_incomplets": dossiers_incomplets,
    }


@router.get("/admin/patients/{patient_id}")
async def admin_get_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.get(User, patient_id)
    patient = db.get(Patient, patient_id)
    if not user or not patient:
        raise HTTPException(404, "Patient introuvable")

    dossier = db.query(DossierMedical).filter(
        DossierMedical.patient_id == patient_id
    ).first()

    rdvs = db.query(RendezVous).filter(
        RendezVous.patient_id == patient_id
    ).order_by(RendezVous.date_heure_debut.desc()).limit(10).all()

    age = None
    if patient.date_naissance:
        today = date.today()
        age = today.year - patient.date_naissance.year - (
            (today.month, today.day) < (patient.date_naissance.month, patient.date_naissance.day)
        )

    return {
        "id": str(user.id),
        "nom": user.nom or "",
        "prenom": user.prenom or "",
        "email": user.email or "",
        "telephone": user.telephone or "",
        "statut": user.statut or "actif",
        "numero_patient": patient.numero_patient or "",
        "sexe": patient.sexe or "",
        "date_naissance": patient.date_naissance.isoformat() if patient.date_naissance else None,
        "age": age,
        "groupe_sanguin": patient.groupe_sanguin or "",
        "ville": patient.ville or "",
        "pays": patient.pays or "CM",
        "allergies": patient.allergies or [],
        "antecedents_medicaux": patient.antecedents_medicaux or "",
        "couverture_assurance": patient.couverture_assurance or "",
        "contact_urgence_nom": patient.contact_urgence_nom or "",
        "contact_urgence_tel": patient.contact_urgence_tel or "",
        "dossier": {
            "antecedents_familiaux": dossier.antecedents_familiaux if dossier else "",
            "antecedents_personnels": dossier.antecedents_personnels if dossier else "",
            "habitudes_vie": dossier.habitudes_vie if dossier else {},
            "vaccinations": dossier.vaccinations if dossier else [],
        } if dossier else None,
        "rendez_vous": [
            {
                "id": str(r.id),
                "date": r.date_heure_debut.strftime("%d/%m/%Y %H:%M"),
                "type": r.type,
                "statut": r.statut,
                "motif": r.motif_consultation or "",
            }
            for r in rdvs
        ],
        "created_at": user.created_at.strftime("%d/%m/%Y") if user.created_at else "",
    }


@router.put("/admin/patients/{patient_id}")
async def admin_update_patient(
    patient_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.get(User, patient_id)
    patient = db.get(Patient, patient_id)
    if not user or not patient:
        raise HTTPException(404, "Patient introuvable")

    if "statut" in payload:
        if payload["statut"] not in ("actif", "inactif", "suspendu"):
            raise HTTPException(400, "Statut invalide")
        user.statut = payload["statut"]
    if "telephone" in payload:
        user.telephone = payload["telephone"]
    if "groupe_sanguin" in payload:
        patient.groupe_sanguin = payload["groupe_sanguin"]
    if "allergies" in payload:
        patient.allergies = payload["allergies"]

    db.commit()
    return {"message": "Patient mis à jour"}


@router.delete("/admin/patients/{patient_id}")
async def admin_delete_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.get(User, patient_id)
    if not user:
        raise HTTPException(404, "Patient introuvable")
    user.statut = "inactif"
    db.commit()
    return {"message": "Patient désactivé"}






@router.get("/admin/me")
async def admin_me(
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Acces refuse — role admin requis")
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "nom": current_user.nom,
        "prenom": current_user.prenom,
        "role": current_user.role,
        "statut": current_user.statut,
    }









# ... (Garde tes routes /admin/patients ici) ...


# ==========================================
# ROUTES MÉDECINS (Version Sécurisée)
# ==========================================


@router.get("/admin/medecins")
async def admin_list_medecins(
    search: Optional[str] = None,
    specialite: Optional[str] = None,
    statut_verification: Optional[str] = None,
    statut_compte: Optional[str] = None,
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    stmt = select(User, Medecin).join(Medecin, Medecin.id == User.id)

    if search:
        kw = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.prenom).like(kw),
                func.lower(User.nom).like(kw),
                func.lower(User.email).like(kw),
                func.lower(Medecin.numero_ordre).like(kw),
            )
        )
    if statut_verification:
        stmt = stmt.where(Medecin.statut_verification == statut_verification)
    if statut_compte:
        stmt = stmt.where(User.statut == statut_compte)

    total = db.execute(
        select(func.count()).select_from(stmt.subquery())
    ).scalar() or 0

    rows = db.execute(
        stmt.order_by(User.created_at.desc()).limit(limit).offset(offset)
    ).all()

    result = []
    for user, medecin in rows:
        # Spécialités
        specs = db.query(Specialite).join(
            MedecinSpecialite, Specialite.id == MedecinSpecialite.specialite_id
        ).filter(MedecinSpecialite.medecin_id == user.id).all()

        # Filtrer par spécialité si demandé
        spec_labels = [s.libelle_fr for s in specs]
        if specialite and specialite not in spec_labels:
            continue

        # Structure
        structure_nom = ""
        if medecin.structure_id:
            struct = db.get(Structure, medecin.structure_id)
            if struct:
                structure_nom = struct.nom_etablissement

        # Nb consultations
        nb_rdv = db.query(func.count(RendezVous.id)).filter(
            RendezVous.medecin_id == user.id,
            RendezVous.statut == "termine",
        ).scalar() or 0

        # Revenus (paiements confirmés)
        from models import Paiement
        from sqlalchemy import func as sqlfunc
        revenus = db.execute(
            select(sqlfunc.sum(Paiement.montant_total - sqlfunc.coalesce(Paiement.frais_plateforme, 0)))
            .where(Paiement.medecin_id == user.id)
            .where(Paiement.statut == "confirme")
        ).scalar() or 0

        result.append({
            "id": str(user.id),
            "nom": user.nom or "",
            "prenom": user.prenom or "",
            "email": user.email or "",
            "telephone": user.telephone or "",
            "statut": user.statut or "actif",
            "statut_verification": medecin.statut_verification or "en_attente",
            "numero_ordre": medecin.numero_ordre or "",
            "specialites": spec_labels,
            "specialite_principale": spec_labels[0] if spec_labels else "N/A",
            "structure": structure_nom or "Cabinet indépendant",
            "annees_experience": medecin.annees_experience or 0,
            "tarif_consultation": float(medecin.tarif_consultation or 0),
            "devise": medecin.devise or "XAF",
            "teleconsultation": bool(medecin.teleconsultation_active),
            "disponible": bool(medecin.disponible_maintenant),
            "note_moyenne": float(medecin.note_moyenne or 0),
            "nb_consultations": nb_rdv,
            "revenus_total": float(revenus),
            "langues": medecin.langues_parlees or [],
            "biographie": medecin.biographie or "",
            "created_at": user.created_at.strftime("%d/%m/%Y") if user.created_at else "",
        })

    return {"medecins": result, "total": total}


@router.get("/admin/stats/medecins")
async def admin_stats_medecins(
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    total = db.execute(select(func.count(Medecin.id))).scalar() or 0

    verifies = db.execute(
        select(func.count(Medecin.id))
        .where(Medecin.statut_verification == "verifie")
    ).scalar() or 0

    en_attente = db.execute(
        select(func.count(Medecin.id))
        .where(Medecin.statut_verification == "en_attente")
    ).scalar() or 0

    disponibles = db.execute(
        select(func.count(Medecin.id))
        .where(Medecin.disponible_maintenant == True)
    ).scalar() or 0

    from models import Paiement
    revenus_total = db.execute(
        select(func.sum(Paiement.montant_total - func.coalesce(Paiement.frais_plateforme, 0)))
        .where(Paiement.statut == "confirme")
    ).scalar() or 0

    return {
        "total": total,
        "verifies": verifies,
        "en_attente_verification": en_attente,
        "disponibles": disponibles,
        "revenus_total_plateforme": float(revenus_total),
    }


@router.get("/admin/medecins/{medecin_id}")
async def admin_get_medecin(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user    = db.get(User,    medecin_id)
    medecin = db.get(Medecin, medecin_id)
    if not user or not medecin:
        raise HTTPException(404, "Médecin introuvable")

    specs = db.query(Specialite).join(
        MedecinSpecialite, Specialite.id == MedecinSpecialite.specialite_id
    ).filter(MedecinSpecialite.medecin_id == medecin_id).all()

    structure_nom = ""
    if medecin.structure_id:
        struct = db.get(Structure, medecin.structure_id)
        if struct:
            structure_nom = struct.nom_etablissement

    rdvs = db.query(RendezVous).filter(
        RendezVous.medecin_id == medecin_id
    ).order_by(RendezVous.date_heure_debut.desc()).limit(10).all()

    from models import Paiement
    revenus = db.execute(
        select(func.sum(Paiement.montant_total - func.coalesce(Paiement.frais_plateforme, 0)))
        .where(Paiement.medecin_id == medecin_id)
        .where(Paiement.statut == "confirme")
    ).scalar() or 0

    return {
        "id": str(user.id),
        "nom": user.nom or "",
        "prenom": user.prenom or "",
        "email": user.email or "",
        "telephone": user.telephone or "",
        "statut": user.statut or "actif",
        "statut_verification": medecin.statut_verification or "en_attente",
        "numero_ordre": medecin.numero_ordre or "",
        "specialites": [s.libelle_fr for s in specs],
        "structure": structure_nom,
        "annees_experience": medecin.annees_experience or 0,
        "tarif_consultation": float(medecin.tarif_consultation or 0),
        "devise": medecin.devise or "XAF",
        "teleconsultation": bool(medecin.teleconsultation_active),
        "disponible": bool(medecin.disponible_maintenant),
        "note_moyenne": float(medecin.note_moyenne or 0),
        "biographie": medecin.biographie or "",
        "langues": medecin.langues_parlees or [],
        "revenus_total": float(revenus),
        "nb_consultations": db.query(func.count(RendezVous.id)).filter(
            RendezVous.medecin_id == medecin_id,
            RendezVous.statut == "termine",
        ).scalar() or 0,
        "rendez_vous": [
            {
                "id": str(r.id),
                "date": r.date_heure_debut.strftime("%d/%m/%Y %H:%M"),
                "type": r.type,
                "statut": r.statut,
                "motif": r.motif_consultation or "",
            }
            for r in rdvs
        ],
        "created_at": user.created_at.strftime("%d/%m/%Y") if user.created_at else "",
    }


@router.patch("/admin/medecins/{medecin_id}/statut")
async def admin_update_medecin_statut(
    medecin_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    medecin = db.get(Medecin, medecin_id)
    user    = db.get(User,    medecin_id)
    if not medecin or not user:
        raise HTTPException(404, "Médecin introuvable")

    nouveau_statut = payload.get("statut")

    # Statut de vérification
    if nouveau_statut in ("verifie", "rejete", "en_attente", "suspendu"):
        medecin.statut_verification = nouveau_statut

    # Statut du compte
    if nouveau_statut in ("actif", "inactif"):
        user.statut = nouveau_statut

    db.commit()
    return {
        "message": "Statut mis à jour",
        "statut_verification": medecin.statut_verification,
        "statut_compte": user.statut,
    }


@router.delete("/admin/medecins/{medecin_id}")
async def admin_delete_medecin(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    user = db.get(User, medecin_id)
    if not user:
        raise HTTPException(404, "Médecin introuvable")
    user.statut = "inactif"
    db.commit()
    return {"message": "Médecin désactivé"}


@router.get("/admin/medecins/{medecin_id}/documents")
async def admin_medecin_documents(
    medecin_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    from models import DocumentMedical
    docs = db.query(DocumentMedical).filter(
        DocumentMedical.uploaded_par == medecin_id,
    ).order_by(DocumentMedical.created_at.desc()).all()

    return [
        {
            "id": str(d.id),
            "nom": d.nom_fichier_original,
            "type": d.type_document,
            "mime_type": d.mime_type,
            "taille": d.taille_octets,
            "url": d.url_stockage,
            "date": d.created_at.strftime("%d/%m/%Y") if d.created_at else "",
        }
        for d in docs
    ]









@router.get("/admin/rendez-vous")
async def admin_list_rdv(
    search: Optional[str] = None,
    statut: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    stmt = select(RendezVous).options(
        joinedload(RendezVous.patient_rel).joinedload(User.medecin), # Ajuste selon tes relations
        joinedload(RendezVous.medecin_rel)
    )
    
    if statut:
        stmt = stmt.where(RendezVous.statut == statut)
    if type:
        stmt = stmt.where(RendezVous.type == type)
    if search:
        kw = f"%{search.lower()}%"
        # Recherche simplifiée (à adapter selon tes relations SQLAlchemy exactes)
        stmt = stmt.join(User, RendezVous.patient_id == User.id).where(
            or_(func.lower(User.prenom).like(kw), func.lower(User.nom).like(kw))
        )

    total = db.execute(select(func.count()).select_from(stmt.subquery())).scalar() or 0
    rdvs = db.execute(stmt.order_by(RendezVous.date_heure_debut.desc()).limit(limit).offset(offset)).scalars().all()

    result = []
    for r in rdvs:
        # Récupération sécurisée des noms (adapte selon tes modèles)
        patient = db.get(User, r.patient_id)
        medecin = db.get(User, r.medecin_id)
        structure = db.get(Structure, r.structure_id) if hasattr(r, 'structure_id') and r.structure_id else None

        result.append({
            "id": str(r.id),
            "patient_prenom": patient.prenom if patient else "",
            "patient_nom": patient.nom if patient else "",
            "medecin_prenom": medecin.prenom if medecin else "",
            "medecin_nom": medecin.nom if medecin else "",
            "structure_nom": structure.nom_etablissement if structure else "Indépendant",
            "motif_consultation": r.motif_consultation,
            "type": r.type,
            "lieu_consultation": r.lieu_consultation,
            "lien_visio": r.lien_visio,
            "date_heure_debut": r.date_heure_debut.isoformat() if r.date_heure_debut else None,
            "statut": r.statut,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return {"rendez_vous": result, "total": total}


@router.post("/admin/rendez-vous")
async def admin_create_rdv(
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    # Vérifie que patient et medecin existent
    if not db.get(User, payload.get("patient_id")) or not db.get(User, payload.get("medecin_id")):
        raise HTTPException(400, "Patient ou Médecin introuvable")

    new_rdv = RendezVous(
        patient_id=payload.get("patient_id"),
        medecin_id=payload.get("medecin_id"),
        structure_id=payload.get("structure_id"),
        motif_consultation=payload.get("motif_consultation"),
        type=payload.get("type", "presentiel"),
        lieu_consultation=payload.get("lieu_consultation"),
        lien_visio=payload.get("lien_visio"),
        date_heure_debut=datetime.fromisoformat(payload.get("date_heure_debut")),
        statut=payload.get("statut", "en_attente"),
    )
    db.add(new_rdv)
    db.commit()
    db.refresh(new_rdv)
    return {"message": "Rendez-vous créé", "id": str(new_rdv.id)}


@router.patch("/admin/rendez-vous/{rdv_id}/statut")
async def admin_update_rdv_statut(
    rdv_id: UUID,
    payload: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    rdv = db.get(RendezVous, rdv_id)
    if not rdv:
        raise HTTPException(404, "Rendez-vous introuvable")
    
    nouveau_statut = payload.get("statut")
    if nouveau_statut not in ["confirme", "annule", "en_attente", "termine"]:
        raise HTTPException(400, "Statut invalide")
        
    rdv.statut = nouveau_statut
    db.commit()
    return {"message": f"Statut mis à jour: {nouveau_statut}"}


@router.delete("/admin/rendez-vous/{rdv_id}")
async def admin_delete_rdv(
    rdv_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_admin),
):
    rdv = db.get(RendezVous, rdv_id)
    if not rdv:
        raise HTTPException(404, "Rendez-vous introuvable")
    
    db.delete(rdv)
    db.commit()
    return {"message": "Rendez-vous supprimé"}
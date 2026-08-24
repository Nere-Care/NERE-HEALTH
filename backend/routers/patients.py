
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session


from fastapi.responses import StreamingResponse
from fpdf import FPDF
import io



from models import Patient, DossierMedical, User, User as UserModel, Ordonnance, OrdonnanceLigne, Consultation
from datetime import date, datetime, timezone, timedelta, date as date_type

from auth import get_current_active_user, require_role
from db import get_db
from schemas import PatientCreate, PatientRead, ProfilUpdate
from pydantic import BaseModel as PydanticBase
from sqlalchemy import func, select, or_

router = APIRouter(tags=["patients"])




class ProfilUpdateComplet(PydanticBase):
    date_naissance: Optional[str] = None
    sexe: Optional[str] = None
    groupe_sanguin: Optional[str] = None
    taille_cm: Optional[float] = None
    poids_kg: Optional[float] = None
    telephone: Optional[str] = None
    ville: Optional[str] = None
    allergies: Optional[List[str]] = None
    antecedents_medicaux: Optional[str] = None
    contact_urgence_nom: Optional[str] = None
    contact_urgence_tel: Optional[str] = None
    contact_urgence_lien: Optional[str] = None

class DossierUpdateComplet(PydanticBase):
    antecedents_familiaux: Optional[str] = None
    antecedents_personnels: Optional[str] = None
    antecedents_chirurgicaux: Optional[str] = None
    antecedents_allergiques: Optional[str] = None
    habitudes_vie: Optional[dict] = None
    vaccinations: Optional[list] = None
    traitements_chroniques: Optional[list] = None


@router.get("/patients", response_model=List[PatientRead])
async def read_patients(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patients = db.query(Patient).limit(limit).all()
    return patients


@router.post("/patients", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_create: PatientCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patient = Patient(**patient_create.dict())
    db.add(patient)
    try:
        db.commit()
        db.refresh(patient)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création du patient"
        if "uq_patients_numero_patient" in str(exc.orig):
            detail = "Ce numéro de patient est déjà utilisé"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc
    return patient


@router.get("/patients/{patient_id}", response_model=PatientRead)
async def read_patient(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin")),
):
    patient = db.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient non trouvé")
    return patient




@router.get("/patients/me/profil")
async def get_my_profil(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Accès réservé aux patients")
    
    patient = db.get(Patient, current_user.id)
    if not patient:
        raise HTTPException(status_code=404, detail="Profil patient introuvable")
    
    dossier = db.query(DossierMedical).filter(DossierMedical.patient_id == current_user.id).first()
    
    # Calcul âge
    age = None
    if patient.date_naissance:
        today = date.today()
        age = today.year - patient.date_naissance.year - (
            (today.month, today.day) < (patient.date_naissance.month, patient.date_naissance.day)
        )
    
    # Parser habitudes_vie (JSONB)
    habitudes = dossier.habitudes_vie if dossier and dossier.habitudes_vie else {}
    
    # Parser vaccinations (JSONB)
    vaccins = dossier.vaccinations if dossier and dossier.vaccinations else []
    
    # Parser traitements_chroniques
    traitements = dossier.traitements_chroniques if dossier and dossier.traitements_chroniques else []
    
    return {
        # Infos User
        "id": str(current_user.id),
        "email": current_user.email,
        "prenom": current_user.prenom,
        "nom": current_user.nom,
        "telephone": current_user.telephone,
        "statut": current_user.statut,
        
        # Infos Patient
        "numero_patient": patient.numero_patient,
        "date_naissance": patient.date_naissance.isoformat() if patient.date_naissance else None,
        "age": age,
        "sexe": patient.sexe,
        "groupe_sanguin": patient.groupe_sanguin,
        "adresse": patient.adresse,
        "ville": patient.ville,
        "region": patient.region,
        "pays": patient.pays,
        "taille_cm": float(patient.taille_cm) if patient.taille_cm else None,
        "poids_kg": float(patient.poids_kg) if patient.poids_kg else None,
        "allergies": patient.allergies or [],
        "antecedents_medicaux": patient.antecedents_medicaux,
        "medicaments_en_cours": patient.medicaments_en_cours,
        "contact_urgence_nom": patient.contact_urgence_nom,
        "contact_urgence_tel": patient.contact_urgence_tel,
        "contact_urgence_lien": patient.contact_urgence_lien,
        
        # Infos DossierMedical
        "antecedents_familiaux": dossier.antecedents_familiaux if dossier else None,
        "antecedents_personnels": dossier.antecedents_personnels if dossier else None,
        "antecedents_chirurgicaux": dossier.antecedents_chirurgicaux if dossier else None,
        "antecedents_allergiques": dossier.antecedents_allergiques if dossier else None,
        "antecedents_gyneco": dossier.antecedents_gyneco if dossier else None,
        "habitudes_vie": habitudes,
        "vaccinations": vaccins,
        "traitements_chroniques": traitements,
    }


@router.put("/patients/me/profil")
async def update_my_profil(
    update: ProfilUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Met à jour le profil du patient connecté"""
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Accès réservé aux patients")
    
    patient = db.get(Patient, current_user.id)
    if not patient:
        raise HTTPException(status_code=404, detail="Profil patient introuvable")
    
    # Update Patient fields (only if provided)
    update_data = update.dict(exclude_unset=True)
    
    if "date_naissance" in update_data:
        patient.date_naissance = update_data["date_naissance"]
    if "sexe" in update_data:
        patient.sexe = update_data["sexe"]
    if "groupe_sanguin" in update_data:
        patient.groupe_sanguin = update_data["groupe_sanguin"]
    if "taille_cm" in update_data:
        patient.taille_cm = update_data["taille_cm"]
    if "poids_kg" in update_data:
        patient.poids_kg = update_data["poids_kg"]
    if "allergies" in update_data:
        patient.allergies = update_data["allergies"]
    if "antecedents_medicaux" in update_data:
        patient.antecedents_medicaux = update_data["antecedents_medicaux"]
    if "medicaments_en_cours" in update_data:
        patient.medicaments_en_cours = update_data["medicaments_en_cours"]
    if "contact_urgence_nom" in update_data:
        patient.contact_urgence_nom = update_data["contact_urgence_nom"]
    if "contact_urgence_tel" in update_data:
        patient.contact_urgence_tel = update_data["contact_urgence_tel"]
    if "contact_urgence_lien" in update_data:
        patient.contact_urgence_lien = update_data["contact_urgence_lien"]
    
    # Get or create DossierMedical
    dossier = db.query(DossierMedical).filter(DossierMedical.patient_id == current_user.id).first()
    if not dossier:
        # Créer le dossier s'il n'existe pas
        numero_dossier = f"DM-{datetime.utcnow().year}-{str(current_user.id)[:8].upper()}"
        dossier = DossierMedical(
            numero_dossier=numero_dossier,
            patient_id=current_user.id,
        )
        db.add(dossier)
    
    # Update DossierMedical fields (only if provided)
    if "antecedents_familiaux" in update_data:
        dossier.antecedents_familiaux = update_data["antecedents_familiaux"]
    if "antecedents_personnels" in update_data:
        dossier.antecedents_personnels = update_data["antecedents_personnels"]
    if "antecedents_chirurgicaux" in update_data:
        dossier.antecedents_chirurgicaux = update_data["antecedents_chirurgicaux"]
    if "antecedents_allergiques" in update_data:
        dossier.antecedents_allergiques = update_data["antecedents_allergiques"]
    if "antecedents_gyneco" in update_data:
        dossier.antecedents_gyneco = update_data["antecedents_gyneco"]
    if "habitudes_vie" in update_data:
        dossier.habitudes_vie = update_data["habitudes_vie"]
    if "vaccinations" in update_data:
        dossier.vaccinations = update_data["vaccinations"]
    if "traitements_chroniques" in update_data:
        dossier.traitements_chroniques = update_data["traitements_chroniques"]
    
    try:
        db.commit()
        return {"message": "Profil mis à jour avec succès"}
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Erreur de mise à jour: {exc.orig}"
        ) from exc







@router.get("/dashboard/patient")
async def get_dashboard_patient(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Dashboard agrégé pour le patient connecté."""
    if current_user.role != "patient":
        raise HTTPException(status_code=403, detail="Accès réservé aux patients")

    today = date.today()
    now = datetime.utcnow()

    from models import RendezVous, Medecin, Consultation, Ordonnance, OrdonnanceLigne, Notification, Specialite, MedecinSpecialite, DossierMedical

    # 1. Rendez-vous à venir
    rdv_a_venir = db.query(RendezVous).filter(
        RendezVous.patient_id == current_user.id,
        RendezVous.date_heure_debut > now,
        RendezVous.statut.in_(["en_attente", "confirme"])
    ).order_by(RendezVous.date_heure_debut).limit(1).first()

    prochain_rdv = None
    if rdv_a_venir:
        medecin = db.get(Medecin, rdv_a_venir.medecin_id)
        medecin_user = db.get(User, rdv_a_venir.medecin_id) if medecin else None
        prochain_rdv = {
            "id": str(rdv_a_venir.id),
            "medecin_nom": f"Dr. {medecin_user.prenom} {medecin_user.nom}" if medecin_user else "Dr. Inconnu",
            "medecin_initiale": medecin_user.prenom[0].upper() if medecin_user and medecin_user.prenom else "D",
            "date": rdv_a_venir.date_heure_debut.isoformat(),
            "type": rdv_a_venir.type,
            "motif": rdv_a_venir.motif_consultation or "Consultation",
            "statut": rdv_a_venir.statut,
            "lien_video": rdv_a_venir.lien_video,
        }

    # 2. Nombre de RDV à venir
    nb_rdv_a_venir = db.query(func.count(RendezVous.id)).filter(
        RendezVous.patient_id == current_user.id,
        RendezVous.date_heure_debut > now,
        RendezVous.statut.in_(["en_attente", "confirme"])
    ).scalar() or 0

    # 3. Consultations du mois
    debut_mois = today.replace(day=1)
    nb_consultations_mois = db.query(func.count(Consultation.id)).filter(
        Consultation.patient_id == current_user.id,
        Consultation.date_heure_debut >= datetime.combine(debut_mois, datetime.min.time())
    ).scalar() or 0

    # 4. Prescriptions actives
    nb_prescriptions = db.query(func.count(Ordonnance.id)).filter(
        Ordonnance.patient_id == current_user.id,
        Ordonnance.statut == "active",
        Ordonnance.date_expiration >= today
    ).scalar() or 0

    # 5. Consultations récentes
    consults_recentes = db.query(Consultation).filter(
        Consultation.patient_id == current_user.id
    ).order_by(Consultation.date_heure_debut.desc()).limit(5).all()

    consultations_list = []
    for c in consults_recentes:
        medecin_user = db.get(User, c.medecin_id)
        consultations_list.append({
            "id": str(c.id),
            "medecin": f"Dr. {medecin_user.prenom} {medecin_user.nom}" if medecin_user else "Dr. Inconnu",
            "medecin_initiale": medecin_user.prenom[0].upper() if medecin_user and medecin_user.prenom else "D",
            "motif": c.motif or "Consultation",
            "date": c.date_heure_debut.isoformat() if c.date_heure_debut else None,
            "statut": c.statut or "termine",
        })

    # 6. Médicaments du jour
    ordonnances_actives = db.query(Ordonnance).filter(
        Ordonnance.patient_id == current_user.id,
        Ordonnance.statut == "active",
        Ordonnance.date_expiration >= today
    ).all()

    medicaments_jour = []
    for ord in ordonnances_actives:
        lignes = db.query(OrdonnanceLigne).filter(
            OrdonnanceLigne.ordonnance_id == ord.id
        ).all()
        for ligne in lignes:
            medicaments_jour.append({
                "id": str(ligne.id),
                "nom": f"{ligne.medicament_nom} {ligne.dosage}",
                "frequence": ligne.frequence_par_jour,
                "posologie": ligne.posologie or "",
            })

    # 7. Notifications non lues
    nb_notifs_non_lues = db.query(func.count(Notification.id)).filter(
        Notification.utilisateur_id == current_user.id,
        Notification.date_lecture.is_(None)
    ).scalar() or 0

    # 8. Spécialités
    specialites_list = db.query(Specialite).filter(
        Specialite.actif == True
    ).order_by(Specialite.ordre_affichage).all()

    specialites_data = [
        {"id": str(s.id), "nom": s.libelle_fr, "icone": s.icone_url or s.code}
        for s in specialites_list
    ]

    # 9. Résumé santé
    patient = db.get(Patient, current_user.id)
    resume_sante = {}
    if patient:
        poids = float(patient.poids_kg) if patient.poids_kg else None
        taille_m = float(patient.taille_cm) / 100 if patient.taille_cm else None
        imc = round(poids / (taille_m ** 2), 1) if poids and taille_m else None

        resume_sante = {
            "poids_kg": poids,
            "taille_cm": float(patient.taille_cm) if patient.taille_cm else None,
            "imc": imc,
            "groupe_sanguin": patient.groupe_sanguin,
        }

    return {
        "patient_nom": f"{current_user.prenom} {current_user.nom}",
        "patient_initiale": current_user.prenom[0].upper() if current_user.prenom else "P",
        "prochain_rdv": prochain_rdv,
        "nb_rdv_a_venir": nb_rdv_a_venir,
        "nb_consultations_mois": nb_consultations_mois,
        "nb_prescriptions": nb_prescriptions,
        "consultations_recentes": consultations_list,
        "medicaments_jour": medicaments_jour,
        "nb_notifications_non_lues": nb_notifs_non_lues,
        "specialites": specialites_data,
        "resume_sante": resume_sante,
    }




@router.put("/patients/me/dossier")
async def update_dossier_patient(
    payload: DossierUpdateComplet,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "patient":
        raise HTTPException(403, "Reserve aux patients")

    dossier = db.query(DossierMedical).filter(
        DossierMedical.patient_id == current_user.id
    ).first()

    if not dossier:
        # Créer le dossier si inexistant
        from uuid import uuid4
        dossier = DossierMedical(
            numero_dossier=f"DM-{date_type.today().year}-{str(uuid4())[:8].upper()}",
            patient_id=current_user.id,
        )
        db.add(dossier)
        db.flush()

    if payload.antecedents_familiaux is not None:
        dossier.antecedents_familiaux = payload.antecedents_familiaux
    if payload.antecedents_personnels is not None:
        dossier.antecedents_personnels = payload.antecedents_personnels
    if payload.antecedents_chirurgicaux is not None:
        dossier.antecedents_chirurgicaux = payload.antecedents_chirurgicaux
    if payload.antecedents_allergiques is not None:
        dossier.antecedents_allergiques = payload.antecedents_allergiques
    if payload.habitudes_vie is not None:
        dossier.habitudes_vie = payload.habitudes_vie
    if payload.vaccinations is not None:
        dossier.vaccinations = payload.vaccinations
    if payload.traitements_chroniques is not None:
        dossier.traitements_chroniques = payload.traitements_chroniques

    db.commit()
    return {"message": "Dossier mis a jour avec succes"}







@router.get("/medecin/mes-patients")
async def medecin_mes_patients(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    from sqlalchemy import select, distinct
    from models import RendezVous, DossierMedical

    # Patients distincts ayant eu un RDV avec ce medecin
    stmt = (
        select(Patient, User)
        .join(User, Patient.id == User.id)
        .join(RendezVous, RendezVous.patient_id == Patient.id)
        .where(RendezVous.medecin_id == current_user.id)
        .distinct(Patient.id)
        .order_by(Patient.id, RendezVous.date_heure_debut.desc())
    )

    if search:
        kw = f"%{search.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(User.prenom).like(kw),
                func.lower(User.nom).like(kw),
                func.lower(Patient.numero_patient).like(kw),
            )
        )

    rows = db.execute(stmt).all()

    result = []
    for patient, user in rows:
        # Dernier RDV
        dernier_rdv = db.query(RendezVous).filter(
            RendezVous.patient_id == patient.id,
            RendezVous.medecin_id == current_user.id,
        ).order_by(RendezVous.date_heure_debut.desc()).first()

        # Dossier medical
        dossier = db.query(DossierMedical).filter(
            DossierMedical.patient_id == patient.id
        ).first()

        initiales = ""
        if user.prenom: initiales += user.prenom[0].upper()
        if user.nom: initiales += user.nom[0].upper()

        result.append({
            "id": str(patient.id),
            "nom": f"{user.prenom} {user.nom}",
            "prenom": user.prenom or "",
            "numero_patient": patient.numero_patient,
            "age": None,  # calcule ci-dessous
            "sexe": patient.sexe,
            "groupe_sanguin": patient.groupe_sanguin,
            "telephone": user.telephone,
            "email": user.email,
            "ville": patient.ville,
            "allergies": patient.allergies or [],
            "initiales": initiales or "?",
            "derniere_visite": dernier_rdv.date_heure_debut.strftime("%d/%m/%Y") if dernier_rdv else None,
            "antecedents_personnels": dossier.antecedents_personnels if dossier else None,
            "antecedents_familiaux": dossier.antecedents_familiaux if dossier else None,
            "antecedents_chirurgicaux": dossier.antecedents_chirurgicaux if dossier else None,
            "habitudes_vie": dossier.habitudes_vie if dossier else {},
            "vaccinations": dossier.vaccinations if dossier else [],
        })

    # Calcul age
    from datetime import date
    today = date.today()
    for i, (patient, user) in enumerate(rows):
        if patient.date_naissance:
            age = today.year - patient.date_naissance.year - (
                (today.month, today.day) < (patient.date_naissance.month, patient.date_naissance.day)
            )
            result[i]["age"] = age

    return result






@router.get("/medecin/patients/{patient_id}/consultations")
async def patient_consultations(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    consultations = db.query(Consultation).filter(
        Consultation.patient_id == patient_id,
        Consultation.medecin_id == current_user.id,
    ).order_by(Consultation.date_heure_debut.desc()).all()

    return [_serialiser_consultation(c, db) for c in consultations]


def _serialiser_consultation(c, db):
    """Serialise une consultation avec le nom du medecin et les prescriptions."""
    medecin_user = db.get(UserModel, c.medecin_id)
    medecin_nom = f"Dr. {medecin_user.prenom} {medecin_user.nom}" if medecin_user else "Medecin inconnu"

    ordonnances = db.query(Ordonnance).filter(Ordonnance.consultation_id == c.id).all()
    prescriptions = []
    for ordo in ordonnances:
        lignes = db.query(OrdonnanceLigne).filter(OrdonnanceLigne.ordonnance_id == ordo.id).all()
        for ligne in lignes:
            prescriptions.append({
                "id": str(ligne.id),
                "name": ligne.medicament_nom,
                "dosage": ligne.dosage,
                "frequency": ligne.posologie,
                "duration": f"{ligne.duree_jours} jours" if ligne.duree_jours else "",
            })

    return {
        "id": str(c.id),
        "numero_consultation": c.numero_consultation,
        "reason": c.motif or "",
        "doctor": medecin_nom,
        "diagnosis": c.diagnostic_principal or "Diagnostic en attente",
        "treatment": c.plan_traitement or "",
        "notes": c.observations or "",
        "date": c.date_heure_debut.strftime("%d/%m/%Y") if c.date_heure_debut else "",
        "time": c.date_heure_debut.strftime("%H:%M") if c.date_heure_debut else "",
        "statut": c.statut,
        "prescriptions": prescriptions,
        "labResults": [],
        # Alias francais conserves pour compatibilite
        "motif": c.motif or "",
        "medecin_nom": medecin_nom,
        "diagnostic": c.diagnostic_principal or "",
        "plan_traitement": c.plan_traitement or "",
    }


@router.get("/patients/me/consultations")
async def mes_consultations(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Vue patient : toutes ses consultations, tous medecins confondus."""
    if current_user.role != "patient":
        raise HTTPException(403, "Reserve aux patients")

    consultations = db.query(Consultation).filter(
        Consultation.patient_id == current_user.id,
    ).order_by(Consultation.date_heure_debut.desc()).all()

    return [_serialiser_consultation(c, db) for c in consultations]


















BLEU_PRINCIPAL = (37, 99, 235)
BLEU_CLAIR = (239, 246, 255)
VERT = (22, 163, 74)
GRIS_TEXTE = (55, 65, 81)
GRIS_CLAIR = (243, 244, 246)
GRIS_LABEL = (156, 163, 175)


def _texte_pdf(valeur, defaut="Non renseigné"):
    if valeur is None:
        return defaut
    texte = str(valeur).strip()
    if not texte:
        return defaut
    remplacements = {
        "’": "'", "‘": "'", """: '"', """: '"',
        "–": "-", "—": "-", "…": "...",
    }
    for ancien, nouveau in remplacements.items():
        texte = texte.replace(ancien, nouveau)
    return texte.encode("latin-1", "replace").decode("latin-1")


class DossierPDF(FPDF):
    def __init__(self, patient_nom):
        super().__init__(format="A4")
        self.patient_nom = patient_nom
        self.set_auto_page_break(auto=True, margin=20)
        self.set_left_margin(15)
        self.set_right_margin(15)

    def header(self):
        # Ignorer le bandeau sur la toute premiere page (deja gere manuellement)
        if self.page_no() == 1:
            return
        self.set_fill_color(*BLEU_PRINCIPAL)
        self.rect(0, 0, 210, 16, "F")
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 10)
        self.set_xy(15, 4)
        self.cell(0, 8, f"NERE Health - Dossier de {self.patient_nom}")
        self.ln(20)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(*GRIS_LABEL)
        self.cell(0, 10, f"Page {self.page_no()} - Document confidentiel", align="C")


def _section_titre(pdf, texte, icone_texte=""):
    pdf.ln(3)
    pdf.set_x(pdf.l_margin)
    pdf.set_fill_color(*BLEU_CLAIR)
    pdf.set_text_color(*BLEU_PRINCIPAL)
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 10, f"  {icone_texte} {texte}", fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.set_text_color(*GRIS_TEXTE)
    pdf.ln(2)


def _ligne_info(pdf, label, valeur, largeur_label=45):
    pdf.set_x(pdf.l_margin)
    pdf.set_font("Helvetica", "B", 9.5)
    pdf.set_text_color(*GRIS_LABEL)
    pdf.cell(largeur_label, 6, _texte_pdf(label))
    pdf.set_font("Helvetica", "", 9.5)
    pdf.set_text_color(*GRIS_TEXTE)
    pdf.multi_cell(0, 6, _texte_pdf(valeur))


def generer_pdf_dossier(patient_user, patient, dossier, consultations_data) -> bytes:
    nom_complet = f"{_texte_pdf(patient_user.prenom)} {_texte_pdf(patient_user.nom)}"
    pdf = DossierPDF(nom_complet)
    pdf.add_page()

    # ── BANDEAU D'EN-TETE (page 1 uniquement, plus grand) ────────────────
    pdf.set_fill_color(*BLEU_PRINCIPAL)
    pdf.rect(0, 0, 210, 45, "F")

    pdf.set_xy(15, 12)
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 22)
    pdf.cell(0, 12, "NERE HEALTH")

    pdf.set_xy(15, 26)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 8, "Dossier medical patient")

    pdf.set_xy(15, 36)
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(0, 6, f"Genere le {date_type.today().strftime('%d/%m/%Y')} - Document confidentiel")

    pdf.set_y(55)
    pdf.set_text_color(*GRIS_TEXTE)

    # ── CARTE IDENTITE PATIENT ────────────────────────────────────────────
    y_carte = pdf.get_y()
    pdf.set_fill_color(*GRIS_CLAIR)
    pdf.rect(15, y_carte, 180, 24, "F")

    pdf.set_xy(20, y_carte + 4)
    pdf.set_font("Helvetica", "B", 15)
    pdf.set_text_color(*GRIS_TEXTE)
    pdf.cell(0, 8, nom_complet)

    numero = patient.numero_patient if patient else "N/A"
    pdf.set_xy(20, y_carte + 13)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_text_color(*GRIS_LABEL)
    pdf.cell(0, 6, f"N. dossier : {_texte_pdf(numero)}")

    pdf.set_y(y_carte + 30)

    # ── INFORMATIONS PERSONNELLES ─────────────────────────────────────────
    _section_titre(pdf, "Informations personnelles")

    if patient:
        try:
            date_naissance = patient.date_naissance.strftime("%d/%m/%Y") if patient.date_naissance else None
        except Exception:
            date_naissance = None

        allergies = ", ".join(patient.allergies) if patient.allergies else None

        for label, valeur in [
            ("Date de naissance", date_naissance),
            ("Sexe", "Masculin" if patient.sexe == "M" else "Feminin" if patient.sexe == "F" else None),
            ("Groupe sanguin", patient.groupe_sanguin),
            ("Ville", patient.ville),
            ("Telephone", patient_user.telephone),
            ("Allergies", allergies),
        ]:
            _ligne_info(pdf, label, valeur)

    # ── ANTECEDENTS ────────────────────────────────────────────────────────
    if dossier and any([dossier.antecedents_personnels, dossier.antecedents_familiaux, dossier.antecedents_chirurgicaux]):
        _section_titre(pdf, "Antecedents medicaux")
        for label, valeur in [
            ("Personnels", dossier.antecedents_personnels),
            ("Familiaux", dossier.antecedents_familiaux),
            ("Chirurgicaux", dossier.antecedents_chirurgicaux),
        ]:
            if valeur:
                _ligne_info(pdf, label, valeur)

    # ── CONSULTATIONS ──────────────────────────────────────────────────────
    _section_titre(pdf, f"Historique des consultations ({len(consultations_data)})")

    if not consultations_data:
        pdf.set_font("Helvetica", "I", 10)
        pdf.set_text_color(*GRIS_LABEL)
        pdf.cell(0, 8, "Aucune consultation enregistree.")
    else:
        for i, c in enumerate(consultations_data):
            try:
                # Garder le bloc de consultation groupe sur la meme page si possible
                if pdf.get_y() > 250:
                    pdf.add_page()

                y_debut = pdf.get_y()
                hauteur_estimee = 22 + (len(c.get("prescriptions") or []) * 5)
                pdf.set_fill_color(255, 255, 255)
                pdf.set_draw_color(*BLEU_PRINCIPAL)
                pdf.rect(15, y_debut, 180, hauteur_estimee, "D")

                pdf.set_xy(19, y_debut + 3)
                pdf.set_font("Helvetica", "B", 10.5)
                pdf.set_text_color(*BLEU_PRINCIPAL)
                pdf.cell(0, 6, _texte_pdf(f"{c.get('date')}  -  {c.get('reason')}"))

                pdf.set_xy(19, y_debut + 9)
                pdf.set_font("Helvetica", "", 9)
                pdf.set_text_color(*GRIS_LABEL)
                pdf.cell(0, 5, _texte_pdf(f"Medecin : {c.get('doctor')}"))

                pdf.set_xy(19, y_debut + 14)
                pdf.set_text_color(*GRIS_TEXTE)
                diagnostic = _texte_pdf(c.get("diagnosis"))
                traitement = c.get("treatment")
                ligne_diag = f"Diagnostic : {diagnostic}"
                if traitement:
                    ligne_diag += f"   |   Traitement : {_texte_pdf(traitement)}"
                pdf.set_font("Helvetica", "", 9)
                pdf.cell(0, 5, ligne_diag[:110])

                y_meds = y_debut + 19
                prescriptions = c.get("prescriptions") or []
                if prescriptions:
                    pdf.set_xy(19, y_meds)
                    pdf.set_font("Helvetica", "B", 8.5)
                    pdf.set_text_color(*VERT)
                    pdf.cell(0, 5, "Prescriptions :")
                    for med in prescriptions:
                        y_meds += 5
                        pdf.set_xy(23, y_meds)
                        pdf.set_font("Helvetica", "", 8.5)
                        pdf.set_text_color(*GRIS_TEXTE)
                        ligne_med = f"- {_texte_pdf(med.get('name'))} : {_texte_pdf(med.get('frequency'), '')}"
                        pdf.cell(0, 5, ligne_med[:100])

                pdf.set_y(y_debut + hauteur_estimee + 5)

            except Exception as e:
                print(f"[PDF WARNING] Consultation ignoree: {e}")
                continue

    return bytes(pdf.output())


@router.get("/medecin/patients/{patient_id}/dossier/pdf")
async def telecharger_dossier_medecin(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "medecin":
        raise HTTPException(403, "Reserve aux medecins")

    a_consulte = db.query(Consultation).filter(
        Consultation.patient_id == patient_id,
        Consultation.medecin_id == current_user.id,
    ).first()
    if not a_consulte:
        raise HTTPException(403, "Vous n'avez jamais consulte ce patient")

    patient_user = db.get(UserModel, patient_id)
    patient = db.get(Patient, patient_id)
    if not patient_user or not patient:
        raise HTTPException(404, "Patient introuvable")

    from models import DossierMedical
    dossier = db.query(DossierMedical).filter(DossierMedical.patient_id == patient_id).first()

    consultations = db.query(Consultation).filter(
        Consultation.patient_id == patient_id
    ).order_by(Consultation.date_heure_debut.desc()).all()
    consultations_data = [_serialiser_consultation(c, db) for c in consultations]

    pdf_bytes = generer_pdf_dossier(patient_user, patient, dossier, consultations_data)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=dossier_{patient.numero_patient}.pdf"},
    )


@router.get("/patients/me/dossier/pdf")
async def telecharger_mon_dossier(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    if current_user.role != "patient":
        raise HTTPException(403, "Reserve aux patients")

    patient = db.get(Patient, current_user.id)
    if not patient:
        raise HTTPException(404, "Profil patient introuvable")

    from models import DossierMedical
    dossier = db.query(DossierMedical).filter(DossierMedical.patient_id == current_user.id).first()

    consultations = db.query(Consultation).filter(
        Consultation.patient_id == current_user.id
    ).order_by(Consultation.date_heure_debut.desc()).all()
    consultations_data = [_serialiser_consultation(c, db) for c in consultations]

    pdf_bytes = generer_pdf_dossier(current_user, patient, dossier, consultations_data)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=mon_dossier_medical.pdf"},
    )



@router.get("/mes-rendez-vous/prochain")
async def prochain_rendez_vous(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    maintenant = datetime.now(timezone.utc)

    stmt = select(RendezVous).where(
        RendezVous.statut == "confirme",
        RendezVous.date_heure_debut > maintenant,
    )
    if current_user.role == "patient":
        stmt = stmt.where(RendezVous.patient_id == current_user.id)
    elif current_user.role == "medecin":
        stmt = stmt.where(RendezVous.medecin_id == current_user.id)
    else:
        raise HTTPException(403, "Reserve aux patients et medecins")

    stmt = stmt.order_by(RendezVous.date_heure_debut.asc()).limit(1)
    rdv = db.execute(stmt).scalar_one_or_none()

    if not rdv:
        return None

    if current_user.role == "patient":
        autre = db.get(User, rdv.medecin_id)
        nom_autre = f"Dr. {autre.prenom} {autre.nom}" if autre else "Medecin"
    else:
        autre = db.get(User, rdv.patient_id)
        nom_autre = f"{autre.prenom} {autre.nom}" if autre else "Patient"

    return {
        "id": str(rdv.id),
        "interlocuteur": nom_autre,
        "date_heure_debut": rdv.date_heure_debut.isoformat(),
        "type": rdv.type,
        "motif": rdv.motif_consultation or "",
    }
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import require_role, get_current_active_user
from db import get_db
from models import User, Patient, Medecin, DossierMedical, Structure
from datetime import date

from schemas import UserRead

router = APIRouter(tags=["users"])




@router.get("/users/me/profil-complet")
async def get_profil_complet(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Retourne le profil complet de l'utilisateur connecté selon son rôle."""
    
    # Infos de base (communes à tous)
    profil = {
        "id": str(current_user.id),
        "email": current_user.email,
        "prenom": current_user.prenom,
        "nom": current_user.nom,
        "telephone": current_user.telephone,
        "role": current_user.role,
        "statut": current_user.statut,
    }
    
    # Infos spécifiques selon le rôle
    if current_user.role == "patient":
        patient = db.get(Patient, current_user.id)
        if patient:
            profil["ville"] = patient.ville
            profil["region"] = patient.region
            profil["pays"] = patient.pays
            profil["date_naissance"] = patient.date_naissance.isoformat() if patient.date_naissance else None
            profil["sexe"] = patient.sexe
            profil["groupe_sanguin"] = patient.groupe_sanguin
            profil["allergies"] = patient.allergies or []
            profil["contact_urgence_nom"] = patient.contact_urgence_nom
            profil["contact_urgence_tel"] = patient.contact_urgence_tel
            profil["contact_urgence_lien"] = patient.contact_urgence_lien
            profil["numero_patient"] = patient.numero_patient
            
            # Calcul âge
            if patient.date_naissance:
                today = date.today()
                age = today.year - patient.date_naissance.year - (
                    (today.month, today.day) < (patient.date_naissance.month, patient.date_naissance.day)
                )
                profil["age"] = age
        
        profil["medecins_autorises"] = []  # À implémenter plus tard
        
    elif current_user.role == "medecin":
        medecin = db.get(Medecin, current_user.id)
        if medecin:
            profil["numero_ordre"] = medecin.numero_ordre
            profil["statut_verification"] = medecin.statut_verification
            profil["annees_experience"] = medecin.annees_experience
            profil["tarif_consultation"] = float(medecin.tarif_consultation) if medecin.tarif_consultation else None
            profil["teleconsultation_active"] = medecin.teleconsultation_active
            profil["note_moyenne"] = float(medecin.note_moyenne) if medecin.note_moyenne else None
            profil["nombre_avis"] = medecin.nombre_avis
            
            # Récupérer la structure
            if medecin.structure_id:
                structure = db.get(Structure, medecin.structure_id)
                if structure:
                    profil["structure_nom"] = structure.nom_etablissement
                    profil["structure_ville"] = structure.ville
            
            # Récupérer les spécialités
            from models import MedecinSpecialite, Specialite
            specialites = db.query(Specialite).join(
                MedecinSpecialite, MedecinSpecialite.specialite_id == Specialite.id
            ).filter(
                MedecinSpecialite.medecin_id == current_user.id
            ).all()
            profil["specialites"] = [{"id": str(s.id), "libelle": s.libelle_fr} for s in specialites]
    
    return profil


@router.put("/users/me/password")
async def change_password(
    old_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    """Change le mot de passe de l'utilisateur connecté."""
    from auth import verify_password, get_password_hash
    
    if not verify_password(old_password, current_user.mot_de_passe_hash):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    
    from auth import validate_password
    try:
        validate_password(new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    current_user.mot_de_passe_hash = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Mot de passe modifié avec succès"}


@router.get("/users", response_model=List[UserRead])
async def read_users(
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    users = db.query(User).all()
    return users




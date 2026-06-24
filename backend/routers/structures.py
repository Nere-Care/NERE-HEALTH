from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import Structure
from typing import List, Optional
from schemas import StructureCreate, StructureRead

router = APIRouter(tags=["structures"])


@router.get("/structures", response_model=list[StructureRead])
async def list_structures(
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Structure).limit(limit)
    structures = db.execute(stmt).scalars().all()
    return structures


@router.post("/structures", response_model=StructureRead, status_code=status.HTTP_201_CREATED)
async def create_structure(
    structure_create: StructureCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    if not structure_create.id:
        structure_create.id = uuid4()

    structure = Structure(**structure_create.dict(exclude_unset=True))
    db.add(structure)
    try:
        db.commit()
        db.refresh(structure)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de la structure") from exc
    return structure


@router.get("/structures/{structure_id}", response_model=StructureRead)
async def read_structure(
    structure_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")
    return structure


@router.put("/structures/{structure_id}", response_model=StructureRead)
async def update_structure(
    structure_id: UUID,
    structure_update: StructureCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")

    for field, value in structure_update.dict(exclude_unset=True).items():
        setattr(structure, field, value)

    db.add(structure)
    try:
        db.commit()
        db.refresh(structure)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de la structure: {exc.orig}") from exc
    return structure


@router.delete("/structures/{structure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_structure(
    structure_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")
    db.delete(structure)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/annuaire/structures")
async def annuaire_structures(
    search: Optional[str] = Query(None),
    type_structure: Optional[str] = Query(None),
    ville: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    from sqlalchemy import or_
    stmt = select(Structure)

    if search:
        stmt = stmt.where(
            or_(
                Structure.nom_etablissement.ilike(f"%{search}%"),
                Structure.ville.ilike(f"%{search}%"),
                Structure.region.ilike(f"%{search}%"),
            )
        )

    if type_structure:
        stmt = stmt.where(Structure.type == type_structure)

    if ville:
        stmt = stmt.where(Structure.ville == ville)

    structures = db.execute(stmt).scalars().all()

    return [
        {
            "id": str(s.id),
            "nom": s.nom_etablissement,
            "type": s.type,
            "ville": s.ville or "",
            "region": s.region or "",
            "adresse": s.adresse or "",
            "telephone": s.telephone_pro or "",
            "email": s.email_pro or "",
            "services": list(s.services_offerts) if s.services_offerts else [],
            "statut_verification": s.statut_verification,
            "horaires": s.horaires_ouverture or {},
            "capacite_lits": s.capacite_lits,
            "latitude": float(s.latitude) if s.latitude else None,
            "longitude": float(s.longitude) if s.longitude else None,
        }
        for s in structures
    ]


@router.get("/structures/{structure_id}/profil")
async def get_structure_profil(
    structure_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    from models import Medecin, Avis, Patient, User
    from sqlalchemy import func
    
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=404, detail="Structure non trouvée")
    
    # 1. Compter les médecins de cette structure
    nb_medecins = db.query(func.count(Medecin.id)).filter(
        Medecin.structure_id == structure_id
    ).scalar() or 0
    
    # 2. Récupérer les IDs des médecins de cette structure
    medecin_ids = [m.id for m in db.query(Medecin.id).filter(Medecin.structure_id == structure_id).all()]
    
    # 3. Récupérer les avis pour ces médecins (sans jointure complexe)
    avis_list = []
    if medecin_ids:
        avis_query = db.query(Avis).filter(
            Avis.medecin_id.in_(medecin_ids),
            Avis.masque == False
        ).order_by(Avis.created_at.desc()).limit(10).all()
        
        for a in avis_query:
            # Récupérer le nom du patient manuellement pour éviter les erreurs de relation ORM
            patient_user = db.query(User).join(Patient, Patient.id == User.id).filter(Patient.id == a.patient_id).first()
            nom_patient = f"{patient_user.prenom} {patient_user.nom[0]}." if patient_user else "Anonyme"
            
            avis_list.append({
                "nom": nom_patient,
                "note": a.note,
                "texte": a.commentaire or "",
                "date": a.created_at.strftime("Il y a %j jours") if a.created_at else "",
            })
    
    # 4. Calculer la note moyenne
    note_moyenne = 0
    if avis_list:
        note_moyenne = round(sum(a["note"] for a in avis_list) / len(avis_list), 1)
    
    # 5. Parser les horaires de façon sécurisée
    horaires = structure.horaires_ouverture or {}
    horaire_texte = "Non renseigné"
    if isinstance(horaires, dict) and horaires.get("lundi"):
        h = horaires["lundi"]
        if isinstance(h, dict):
            horaire_texte = f"{h.get('ouverture', '')} - {h.get('fermeture', '')}"
    
    return {
        "id": str(structure.id),
        "nom": structure.nom_etablissement,
        "type": structure.type,
        "statut_verification": structure.statut_verification,
        "ville": structure.ville or "",
        "region": structure.region or "",
        "adresse": structure.adresse or "",
        "telephone": structure.telephone_pro or "",
        "email": structure.email_pro or "",
        "site_web": structure.site_web or "",
        "description": structure.description or "",
        "logo_url": structure.logo_url or "",
        "services": list(structure.services_offerts) if structure.services_offerts else [],
        "horaires": horaires,
        "horaire_texte": horaire_texte,
        "capacite_lits": structure.capacite_lits,
        "latitude": float(structure.latitude) if structure.latitude else None,
        "longitude": float(structure.longitude) if structure.longitude else None,
        "nb_medecins": nb_medecins,
        "note_moyenne": note_moyenne,
        "avis": avis_list,
    }
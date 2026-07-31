from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from access_control import get_dossier_access_level
from db import get_db
from models import Consultation, DocumentMedical, Medecin, Notification, Ordonnance, OrdonnanceLigne, Patient, PriseMedicament, User, Structure
from schemas import OrdonnanceCreate, OrdonnanceRead, StatutTraitementUpdate, TraitementProgression
from timezone import local_today
from services.pdf_generator import generate_ordonnance_pdf

router = APIRouter(tags=["ordonnances"])

FORME_NORM = {
    "comprime": "comprimes", "comprimé": "comprimes", "comprimes": "comprimes",
    "comprime pellicule": "comprimes", "comprimé pelliculé": "comprimes", "comprimé pellicule": "comprimes",
    "gelule": "gelules", "gélule": "gelules", "gelules": "gelules",
    "sirop": "sirop", "injectable": "injectable", "creme": "creme", "crème": "creme",
    "pommade": "pommade", "gouttes": "gouttes", "suppositoire": "suppositoire",
    "patch": "patch", "inhalateur": "inhalateur", "autre": "autre",
}


def normalize_forme(raw: str) -> str:
    return FORME_NORM.get(raw.lower().strip(), "autre")


import re

def infer_frequence_par_jour(posologie: str) -> int:
    p = posologie.lower()
    has_matin = bool(re.search(r'matin|matinée', p))
    has_midi = bool(re.search(r'\bmidi\b', p))
    has_soir = bool(re.search(r'soir|soirée|coucher', p))
    if has_matin and has_midi and has_soir:
        return 3
    if (has_matin and has_soir) or re.search(r'2\s*fois|deux\s*fois', p):
        return 2
    if re.search(r'3\s*fois|trois\s*fois', p):
        return 3
    if has_matin or has_midi or has_soir:
        return 1
    if re.search(r'une?\s*fois', p):
        return 1
    return 1


@router.get("/ordonnances", response_model=List[OrdonnanceRead])
async def list_ordonnances(
    patient_id: Optional[UUID] = None,
    medecin_id: Optional[UUID] = None,
    statut: Optional[str] = None,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    stmt = select(Ordonnance)
    if patient_id:
        if current_user.role == "medecin":
            access = get_dossier_access_level(db, current_user, patient_id)
            if access == "restricted":
                stmt = stmt.where(
                    Ordonnance.patient_id == patient_id,
                    (Ordonnance.medecin_id == current_user.id) | (Ordonnance.medecin_id.is_(None)),
                )
            else:
                stmt = stmt.where(Ordonnance.patient_id == patient_id)
        else:
            stmt = stmt.where(Ordonnance.patient_id == patient_id)
    if medecin_id:
        stmt = stmt.where(Ordonnance.medecin_id == medecin_id)
    if statut:
        stmt = stmt.where(Ordonnance.statut == statut)
    if current_user.role != "admin" and not patient_id:
        stmt = stmt.where(
            (Ordonnance.medecin_id == current_user.id) | (Ordonnance.patient_id == current_user.id)
        )
    stmt = stmt.order_by(Ordonnance.date_emission.desc()).limit(limit)
    ordonnances = db.execute(stmt).scalars().all()

    medecin_ids = {o.medecin_id for o in ordonnances if o.medecin_id}
    if medecin_ids:
        users = {u.id: u for u in db.execute(select(User).where(User.id.in_(medecin_ids))).scalars().all()}
        for o in ordonnances:
            if not o.medecin_nom_libre and o.medecin_id and o.medecin_id in users:
                u = users[o.medecin_id]
                o.medecin_nom_libre = f"Dr. {u.prenom or ''} {u.nom or ''}".strip()

    return ordonnances


@router.post("/ordonnances", response_model=OrdonnanceRead, status_code=status.HTTP_201_CREATED)
async def create_ordonnance(
    ordonnance_create: OrdonnanceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    if current_user.role == "medecin" and current_user.statut in ("suspendu", "banni"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Votre compte est suspendu. Impossible de créer des ordonnances.")

    if not db.get(Patient, ordonnance_create.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")
    if ordonnance_create.consultation_id and not db.get(Consultation, ordonnance_create.consultation_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Consultation introuvable")
    if ordonnance_create.medecin_id:
        medecin = db.get(User, ordonnance_create.medecin_id)
        if not medecin or medecin.role != "medecin":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Médecin introuvable")

    ordonnance = Ordonnance(
        **{k: v for k, v in ordonnance_create.dict(exclude={"lignes"}).items() if v is not None}
    )
    db.add(ordonnance)
    db.flush()

    for ligne_data in ordonnance_create.lignes or []:
        ligne_dict = ligne_data.dict(exclude_unset=True)
        if "forme" in ligne_dict and ligne_dict["forme"]:
            ligne_dict["forme"] = normalize_forme(ligne_dict["forme"])
        if ligne_dict.get("frequence_par_jour", 1) <= 1 and ligne_dict.get("posologie"):
            ligne_dict["frequence_par_jour"] = infer_frequence_par_jour(ligne_dict["posologie"])
        ligne = OrdonnanceLigne(
            ordonnance_id=ordonnance.id,
            **ligne_dict,
        )
        db.add(ligne)

    try:
        db.commit()
        db.refresh(ordonnance)
    except IntegrityError as exc:
        db.rollback()
        detail = "Erreur de création d'ordonnance"
        if "uq_ordonnances_numero" in str(exc.orig):
            detail = "Ce numéro d'ordonnance est déjà utilisé"
        elif "uq_ordonnances_code_pharmacie" in str(exc.orig):
            detail = "Ce code pharmacie est déjà utilisé"
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail) from exc

    if ordonnance.date_debut_traitement:
        db.expire_all()
        from routers.prises_medicaments import generer_prises_pour_ordonnance
        count = generer_prises_pour_ordonnance(db, ordonnance.id)
        if count > 0:
            db.commit()

    _generate_and_store_pdf(db, ordonnance, current_user)

    return ordonnance


@router.get("/ordonnances/{ordonnance_id}", response_model=OrdonnanceRead)
async def read_ordonnance(
    ordonnance_id: UUID,
    db: Session = Depends(get_db),
):
    ordonnance = db.get(Ordonnance, ordonnance_id)
    if not ordonnance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordonnance non trouvée")
    return ordonnance


@router.delete("/ordonnances/{ordonnance_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ordonnance(
    ordonnance_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    ordonnance = db.get(Ordonnance, ordonnance_id)
    if not ordonnance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordonnance non trouvée")
    if current_user.role != "admin" and current_user.id not in (ordonnance.medecin_id, ordonnance.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
    db.delete(ordonnance)
    db.commit()


@router.post("/ordonnances/{ordonnance_id}/renew", response_model=OrdonnanceRead, status_code=status.HTTP_201_CREATED)
async def renew_ordonnance(
    ordonnance_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    orig = db.get(Ordonnance, ordonnance_id)
    if not orig:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordonnance non trouvée")
    if current_user.role != "admin" and current_user.id not in (orig.medecin_id, orig.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    if orig.nb_renouvellements_max > 0 and orig.nb_renouvellements >= orig.nb_renouvellements_max:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Nombre maximum de renouvellements atteint")

    now = local_today()
    new_expiration = now + timedelta(days=90)

    nouvelle = Ordonnance(
        numero=f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{current_user.id.hex[:4].upper()}",
        consultation_id=orig.consultation_id,
        medecin_id=orig.medecin_id,
        medecin_nom_libre=orig.medecin_nom_libre,
        patient_id=orig.patient_id,
        motif=orig.motif,
        type_consultation=orig.type_consultation,
        structure_nom=orig.structure_nom,
        adresse_structure=orig.adresse_structure,
        date_emission=now,
        date_expiration=new_expiration,
        notes_medecin=orig.notes_medecin,
        renouvelable=orig.renouvelable,
        nb_renouvellements_max=orig.nb_renouvellements_max,
        nb_renouvellements=orig.nb_renouvellements + 1,
        qr_code_data=f"ordonnance-renew-{datetime.now(timezone.utc).timestamp()}",
    )
    db.add(nouvelle)
    db.flush()

    for l in orig.lignes:
        nouvelle_ligne = OrdonnanceLigne(
            ordonnance_id=nouvelle.id,
            ordre=l.ordre,
            medicament_nom=l.medicament_nom,
            dci=l.dci,
            classe_therapeutique=l.classe_therapeutique,
            dosage=l.dosage,
            forme=l.forme,
            posologie=l.posologie,
            frequence_par_jour=l.frequence_par_jour,
            duree_jours=l.duree_jours,
            quantite=l.quantite,
            avant_repas=l.avant_repas,
            heure_prise=l.heure_prise,
            instructions_speciales=l.instructions_speciales,
            interactions_a_eviter=l.interactions_a_eviter,
        )
        db.add(nouvelle_ligne)

    try:
        db.commit()
        db.refresh(nouvelle)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur lors du renouvellement") from exc
    return nouvelle


@router.put("/ordonnances/{ordonnance_id}/statut-traitement", response_model=OrdonnanceRead)
async def update_statut_traitement(
    ordonnance_id: UUID,
    payload: StatutTraitementUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin", "medecin", "patient")),
):
    ordonnance = db.get(Ordonnance, ordonnance_id)
    if not ordonnance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordonnance non trouvée")
    if current_user.role != "admin" and current_user.id not in (ordonnance.medecin_id, ordonnance.patient_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    valid = ("EN_COURS", "TERMINE", "ARRETE")
    if payload.statut_traitement not in valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Statut invalide. Valeurs acceptées : {', '.join(valid)}")

    date_changed = False
    ordonnance.statut_traitement = payload.statut_traitement
    if payload.date_debut_traitement and payload.date_debut_traitement != ordonnance.date_debut_traitement:
        ordonnance.date_debut_traitement = payload.date_debut_traitement
        date_changed = True
    if payload.statut_traitement == "ARRETE":
        ordonnance.date_arret_traitement = payload.date_arret_traitement or local_today()
        ordonnance.motif_arret_traitement = payload.motif_arret_traitement
    elif payload.statut_traitement == "TERMINE":
        ordonnance.date_arret_traitement = None
        ordonnance.motif_arret_traitement = None

    db.commit()
    db.refresh(ordonnance)

    if date_changed and ordonnance.date_debut_traitement:
        db.query(PriseMedicament).filter(
            PriseMedicament.ordonnance_id == ordonnance.id
        ).delete()
        db.commit()
        db.expire_all()
        from routers.prises_medicaments import generer_prises_pour_ordonnance
        count = generer_prises_pour_ordonnance(db, ordonnance.id)
        if count > 0:
            db.commit()

    return ordonnance


@router.get("/ordonnances/{ordonnance_id}/progression", response_model=TraitementProgression)
async def get_traitement_progression(
    ordonnance_id: UUID,
    db: Session = Depends(get_db),
):
    ordonnance = db.get(Ordonnance, ordonnance_id)
    if not ordonnance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordonnance non trouvée")

    prises = db.execute(
        select(PriseMedicament).where(PriseMedicament.ordonnance_id == ordonnance_id)
    ).scalars().all()

    total_prevues = len(prises)
    total_effectuees = sum(1 for p in prises if p.statut == "PRIS")
    total_oubliees = sum(1 for p in prises if p.statut == "OUBLIE")

    duree_totale = max(
        (ligne.duree_jours for ligne in ordonnance.lignes if ligne.duree_jours),
        default=0,
    )

    today = local_today()
    if ordonnance.date_debut_traitement:
        jours_effectues = max(0, (today - ordonnance.date_debut_traitement).days)
    else:
        jours_effectues = 0

    if total_prevues > 0:
        pourcentage = round((total_effectuees / total_prevues) * 100, 1)
    elif duree_totale > 0:
        pourcentage = round(min(jours_effectues / duree_totale, 1.0) * 100, 1)
    else:
        pourcentage = 0.0

    jours_restants = max(0, duree_totale - jours_effectues)

    auto_updated = False
    if (
        ordonnance.date_debut_traitement
        and ordonnance.date_debut_traitement <= today
        and ordonnance.statut_traitement is None
    ):
        ordonnance.statut_traitement = "EN_COURS"
        auto_updated = True

    all_done = total_prevues > 0 and total_effectuees == total_prevues
    if ordonnance.statut_traitement == "ARRETE":
        statut = "ARRETE"
        couleur = "rouge"
    elif all_done:
        statut = "TERMINE"
        couleur = "vert"
        jours_restants = 0
        pourcentage = 100.0
        if ordonnance.statut_traitement != "TERMINE":
            ordonnance.statut_traitement = "TERMINE"
            auto_updated = True
    else:
        statut = ordonnance.statut_traitement or "EN_COURS"
        couleur = "rouge"

    if auto_updated:
        db.commit()
        db.refresh(ordonnance)

    prochaine = None
    if statut == "EN_COURS":
        stmt_next = (
            select(PriseMedicament)
            .where(PriseMedicament.ordonnance_id == ordonnance_id)
            .where(PriseMedicament.statut == "A_PRENDRE")
            .order_by(PriseMedicament.date_prise_prevue, PriseMedicament.heure_prise_prevue)
            .limit(1)
        )
        prochaine = db.execute(stmt_next).scalar_one_or_none()

    return TraitementProgression(
        ordonnance_id=ordonnance.id,
        numero=ordonnance.numero,
        jours_effectues=jours_effectues,
        jours_restants=jours_restants,
        duree_totale=duree_totale,
        pourcentage=pourcentage,
        statut=statut,
        couleur=couleur,
        total_prises_prevues=total_prevues,
        total_prises_effectuees=total_effectuees,
        total_prises_oubliees=total_oubliees,
        prochaine_prise=prochaine,
    )


DOC_TYPE_LABELS = {
    "ordonnance_scannee": "Ordonnance",
    "ordonnance_biologie": "Demande d'examens biologiques",
    "ordonnance_imagerie": "Demande d'imagerie médicale",
}


def _generate_and_store_pdf(db: Session, ordonnance, current_user):
    if ordonnance.type_ordonnance not in ("medicament", "biologie", "imagerie"):
        return
    try:
        patient_user = db.get(User, ordonnance.patient_id)
        medecin_user = None
        medecin_info = None
        if ordonnance.medecin_id:
            medecin_user = db.get(User, ordonnance.medecin_id)
            medecin_info = db.get(Medecin, ordonnance.medecin_id)
        structure = None
        if medecin_info and medecin_info.structure_id:
            structure = db.get(Structure, medecin_info.structure_id)

        result = generate_ordonnance_pdf(ordonnance, patient_user, medecin_user, medecin_info, structure)

        nom_fichier = f"ordonnance_{ordonnance.numero}.pdf"
        medecin_uploadeur = None
        if current_user.role == "medecin":
            medecin_uploadeur = current_user.id

        document = DocumentMedical(
            patient_id=ordonnance.patient_id,
            consultation_id=ordonnance.consultation_id,
            medecin_uploadeur_id=medecin_uploadeur,
            uploaded_par=current_user.id,
            type_document=result["doc_type"],
            nom_fichier_original=nom_fichier,
            nom_fichier_stockage=result["filename"],
            url_stockage=result["url"],
            checksum_sha256=result["checksum"],
            taille_octets=result["file_size"],
            mime_type="application/pdf",
            description=DOC_TYPE_LABELS.get(result["doc_type"], "Ordonnance"),
            date_document=datetime.now().date(),
            prescripteur_nom=f"{getattr(current_user, 'prenom', '') or ''} {getattr(current_user, 'nom', '') or ''}".strip() or None,
            partage_avec_medecins=[],
            visible_patient=True,
        )
        db.add(document)

        ordonnance.pdf_url = result["url"]

        _create_ordo_notification(db, document, current_user, ordonnance.patient_id, ordonnance.numero, ordonnance.type_ordonnance)

        db.commit()
    except Exception as exc:
        db.rollback()
        import traceback
        traceback.print_exc()


def _create_ordo_notification(db, document, current_user, patient_id, numero, type_ordonnance):
    try:
        patient_user = db.get(User, patient_id)
        if not patient_user:
            return
        doc_label = DOC_TYPE_LABELS.get(document.type_document, "Ordonnance")
        notification = Notification(
            utilisateur_id=patient_id,
            type="document_ajoute",
            canal="in_app",
            statut="en_attente",
            titre="Nouvelle ordonnance",
            contenu=f"Votre ordonnance n°{numero} ({doc_label}) a été enregistrée dans votre dossier médical.",
            donnees_supplementaires={
                "document_id": str(document.id),
                "type_document": document.type_document,
                "ordonnance_numero": numero,
            },
        )
        db.add(notification)
    except Exception:
        pass

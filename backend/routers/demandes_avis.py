from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, aliased

from auth import require_role
from db import get_db
from models import (
    Consultation,
    Conversation,
    DemandeAvisMedical,
    DossierMedical,
    Medecin,
    MedecinSpecialite,
    Message,
    Patient,
    ProfessionnelAutorise,
    Specialite,
    Structure,
    User,
)
from schemas import DemandeAvisMedicalCreate, DemandeAvisMedicalRead
from services.notification_service import notification_service

router = APIRouter(tags=["demandes_avis"])

CAMEROUN_CITIES = {"douala", "yaoundé", "yaounde", "bafoussam", "bamenda", "garoua", "maroua"}


def _find_target_medecins(
    db: Session,
    specialite_id: UUID,
    portee: str,
) -> list[Medecin]:
    stmt = (
        select(Medecin)
        .join(MedecinSpecialite, Medecin.id == MedecinSpecialite.medecin_id)
        .join(User, Medecin.id == User.id)
        .outerjoin(Structure, Medecin.structure_id == Structure.id)
        .where(
            MedecinSpecialite.specialite_id == specialite_id,
            User.statut != "banni",
            Medecin.statut_verification == "verifie",
        )
    )

    if portee == "cameroun":
        stmt = stmt.where(
            or_(
                and_(
                    Medecin.structure_id.isnot(None),
                    Structure.pays == "CM",
                ),
                and_(
                    Medecin.structure_id.is_(None),
                    func.lower(Medecin.ville).in_(CAMEROUN_CITIES),
                ),
            )
        )
    else:
        stmt = stmt.where(
            or_(
                and_(
                    Medecin.structure_id.isnot(None),
                    Structure.pays != "CM",
                ),
                and_(
                    Medecin.structure_id.is_(None),
                    or_(
                        func.lower(Medecin.ville).notin_(CAMEROUN_CITIES),
                        Medecin.ville.is_(None),
                    ),
                ),
            )
        )

    return db.execute(stmt).scalars().all()


@router.post("/demandes-avis", response_model=DemandeAvisMedicalRead, status_code=status.HTTP_201_CREATED)
async def create_demande_avis(
    data: DemandeAvisMedicalCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    medecin = db.get(Medecin, current_user.id)
    if not medecin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Profil médecin introuvable")

    if not db.get(Patient, data.patient_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Patient introuvable")

    if not db.get(Specialite, data.specialite_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Spécialité introuvable")

    if data.consultation_id and not db.get(Consultation, data.consultation_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Consultation introuvable")

    target_medecins = _find_target_medecins(db, data.specialite_id, data.portee)

    demande = DemandeAvisMedical(
        medecin_demandeur_id=current_user.id,
        patient_id=data.patient_id,
        specialite_id=data.specialite_id,
        portee=data.portee,
        consultation_id=data.consultation_id,
        dossier_medical_id=data.dossier_medical_id,
        motif=data.motif,
        message=data.message,
        confidentiel=data.confidentiel,
        medecin_cible_id=data.medecin_cible_id,
    )
    db.add(demande)
    db.flush()

    if data.medecin_cible_id and data.medecin_cible_id != current_user.id:
        existing_auth = db.execute(
            select(ProfessionnelAutorise).where(
                ProfessionnelAutorise.patient_id == data.patient_id,
                ProfessionnelAutorise.medecin_id == data.medecin_cible_id,
            )
        ).scalars().first()
        if not existing_auth:
            db.add(ProfessionnelAutorise(
                patient_id=data.patient_id,
                medecin_id=data.medecin_cible_id,
            ))

    if data.medecin_cible_id:
        if data.medecin_cible_id != current_user.id:
            notification_service.send_notification(
                db=db,
                utilisateur_id=data.medecin_cible_id,
                type_notif="demande_avis_recue",
                canal="in_app",
                titre="Nouvelle demande d'avis médical",
                contenu="Un confrère sollicite votre avis médical.",
                donnees={"demande_id": str(demande.id)},
            )
    else:
        for med in target_medecins:
            if med.id != current_user.id:
                notification_service.send_notification(
                    db=db,
                    utilisateur_id=med.id,
                    type_notif="demande_avis_recue",
                    canal="in_app",
                    titre="Nouvelle demande d'avis médical",
                    contenu="Un confrère sollicite votre avis pour une spécialité.",
                    donnees={"demande_id": str(demande.id)},
                )

    db.commit()
    db.refresh(demande)
    return demande


@router.get("/demandes-avis", response_model=List[DemandeAvisMedicalRead])
async def list_demandes_avis(
    statut: Optional[str] = None,
    specialite_id: Optional[UUID] = None,
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin", "admin")),
):
    demandeur_user = aliased(User, name="demandeur_user")
    patient_table = aliased(Patient, name="patient_table")
    patient_user = aliased(User, name="patient_user")
    cible_user = aliased(User, name="cible_user")

    base_join = (
        select(
            DemandeAvisMedical,
            demandeur_user.prenom.label("demandeur_prenom"),
            demandeur_user.nom.label("demandeur_nom"),
            Specialite.libelle_fr.label("specialite_libelle"),
            patient_user.prenom.label("patient_prenom"),
            patient_user.nom.label("patient_nom"),
            cible_user.prenom.label("cible_prenom"),
            cible_user.nom.label("cible_nom"),
        )
        .join(demandeur_user, DemandeAvisMedical.medecin_demandeur_id == demandeur_user.id)
        .join(Specialite, DemandeAvisMedical.specialite_id == Specialite.id)
        .outerjoin(patient_table, DemandeAvisMedical.patient_id == patient_table.id)
        .outerjoin(patient_user, patient_table.id == patient_user.id)
        .outerjoin(cible_user, DemandeAvisMedical.medecin_cible_id == cible_user.id)
    )

    if current_user.role == "medecin":
        medecin = db.get(Medecin, current_user.id)
        eligible_condition = None

        if medecin and medecin.statut_verification == "verifie":
            my_specialites = [
                row[0] for row in db.execute(
                    select(MedecinSpecialite.specialite_id).where(
                        MedecinSpecialite.medecin_id == current_user.id
                    )
                ).all()
            ]

            if my_specialites:
                eligible_condition = and_(
                    DemandeAvisMedical.statut == "en_attente",
                    DemandeAvisMedical.medecin_demandeur_id != current_user.id,
                    DemandeAvisMedical.medecin_accepteur_id.is_(None),
                    DemandeAvisMedical.specialite_id.in_(my_specialites),
                )

        conditions = [
            DemandeAvisMedical.medecin_demandeur_id == current_user.id,
            DemandeAvisMedical.medecin_accepteur_id == current_user.id,
            DemandeAvisMedical.medecin_cible_id == current_user.id,
        ]
        if eligible_condition is not None:
            conditions.append(eligible_condition)

        base_join = base_join.where(or_(*conditions))

    if statut:
        base_join = base_join.where(DemandeAvisMedical.statut == statut)
    if specialite_id:
        base_join = base_join.where(DemandeAvisMedical.specialite_id == specialite_id)

    rows = db.execute(base_join.order_by(DemandeAvisMedical.created_at.desc()).limit(limit)).all()

    results = []
    for row in rows:
        d = row[0]
        d.demandeur_prenom = row[1]
        d.demandeur_nom = row[2]
        d.specialite_libelle = row[3]
        d.patient_prenom = row[4]
        d.patient_nom = row[5]
        d.cible_prenom = row[6]
        d.cible_nom = row[7]

        if d.dossier_medical_id:
            dossier = db.get(DossierMedical, d.dossier_medical_id)
            if dossier:
                d.dossier_numero = dossier.numero_dossier
        if d.consultation_id:
            consultation = db.get(Consultation, d.consultation_id)
            if consultation:
                d.consultation_numero = consultation.numero_consultation
                d.consultation_motif = consultation.motif

        results.append(d)

    return results


@router.get("/demandes-avis/{demande_id}", response_model=DemandeAvisMedicalRead)
async def read_demande_avis(
    demande_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin", "admin")),
):
    demande = db.get(DemandeAvisMedical, demande_id)
    if not demande:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande non trouvée")

    if current_user.role == "medecin":
        if demande.medecin_cible_id:
            if current_user.id != demande.medecin_cible_id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")
        else:
            target_medecins = _find_target_medecins(db, demande.specialite_id, demande.portee)
            target_ids = {m.id for m in target_medecins}
            if current_user.id != demande.medecin_demandeur_id and current_user.id not in target_ids:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    demandeur_user = db.get(User, demande.medecin_demandeur_id)
    patient_table = db.get(Patient, demande.patient_id) if demande.patient_id else None
    patient_user = db.get(User, patient_table.id) if patient_table else None
    spec = db.get(Specialite, demande.specialite_id)
    cible_user = db.get(User, demande.medecin_cible_id) if demande.medecin_cible_id else None

    demande.demandeur_prenom = demandeur_user.prenom if demandeur_user else None
    demande.demandeur_nom = demandeur_user.nom if demandeur_user else None
    demande.specialite_libelle = (spec.libelle_fr or spec.libelle_en) if spec else None
    demande.patient_prenom = patient_user.prenom if patient_user else None
    demande.patient_nom = patient_user.nom if patient_user else None
    demande.cible_prenom = cible_user.prenom if cible_user else None
    demande.cible_nom = cible_user.nom if cible_user else None

    if demande.dossier_medical_id:
        dossier = db.get(DossierMedical, demande.dossier_medical_id)
        if dossier:
            demande.dossier_numero = dossier.numero_dossier
    if demande.consultation_id:
        consultation = db.get(Consultation, demande.consultation_id)
        if consultation:
            demande.consultation_numero = consultation.numero_consultation
            demande.consultation_motif = consultation.motif

    return demande


@router.put("/demandes-avis/{demande_id}/accepter", response_model=DemandeAvisMedicalRead)
async def accepter_demande_avis(
    demande_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    demande = db.get(DemandeAvisMedical, demande_id)
    if not demande:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande non trouvée")
    if demande.statut != "en_attente":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cette demande n'est plus disponible")

    if demande.medecin_cible_id:
        if current_user.id != demande.medecin_cible_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'êtes pas le destinataire de cette demande")
    else:
        target_medecins = _find_target_medecins(db, demande.specialite_id, demande.portee)
        target_ids = {m.id for m in target_medecins}
        if current_user.id not in target_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'êtes pas éligible pour cette demande")

    demande.statut = "acceptee"
    demande.medecin_accepteur_id = current_user.id

    if current_user.id != demande.medecin_demandeur_id:
        existing_auth = db.execute(
            select(ProfessionnelAutorise).where(
                ProfessionnelAutorise.patient_id == demande.patient_id,
                ProfessionnelAutorise.medecin_id == current_user.id,
            )
        ).scalars().first()
        if not existing_auth:
            db.add(ProfessionnelAutorise(
                patient_id=demande.patient_id,
                medecin_id=current_user.id,
            ))

    notification_service.send_notification(
        db=db,
        utilisateur_id=demande.medecin_demandeur_id,
        type_notif="demande_avis_acceptee",
        canal="in_app",
        titre="Demande d'avis acceptée",
        contenu="Un confrère a accepté votre demande d'avis médical.",
        donnees={"demande_id": str(demande.id)},
    )

    for med in target_medecins:
        if med.id != current_user.id and med.id != demande.medecin_demandeur_id:
            notification_service.send_notification(
                db=db,
                utilisateur_id=med.id,
                type_notif="demande_avis_refusee",
                canal="in_app",
                titre="Demande d'avis pourvue",
                contenu="Cette demande d'avis a déjà été prise en charge par un confrère.",
                donnees={"demande_id": str(demande.id)},
            )

    db.commit()
    db.refresh(demande)
    return demande


@router.put("/demandes-avis/{demande_id}/accepter-et-discuter")
async def accepter_et_discuter(
    demande_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    demande = db.get(DemandeAvisMedical, demande_id)
    if not demande:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande non trouvée")
    if demande.statut != "en_attente":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cette demande n'est plus disponible")

    if demande.medecin_cible_id:
        if current_user.id != demande.medecin_cible_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'êtes pas le destinataire de cette demande")
    else:
        target_medecins = _find_target_medecins(db, demande.specialite_id, demande.portee)
        target_ids = {m.id for m in target_medecins}
        if current_user.id not in target_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'êtes pas éligible pour cette demande")

    demande.statut = "acceptee"
    demande.medecin_accepteur_id = current_user.id

    if current_user.id != demande.medecin_demandeur_id:
        existing_auth = db.execute(
            select(ProfessionnelAutorise).where(
                ProfessionnelAutorise.patient_id == demande.patient_id,
                ProfessionnelAutorise.medecin_id == current_user.id,
            )
        ).scalars().first()
        if not existing_auth:
            db.add(ProfessionnelAutorise(
                patient_id=demande.patient_id,
                medecin_id=current_user.id,
            ))

    notification_service.send_notification(
        db=db,
        utilisateur_id=demande.medecin_demandeur_id,
        type_notif="demande_avis_acceptee",
        canal="in_app",
        titre="Demande d'avis acceptée",
        contenu="Un confrère a accepté votre demande d'avis médical.",
        donnees={"demande_id": str(demande.id)},
    )

    conversation = Conversation(
        medecin_id=current_user.id,
        demande_avis_id=demande.id,
    )
    db.add(conversation)
    db.flush()

    system_msg = Message(
        conversation_id=conversation.id,
        expediteur_id=current_user.id,
        contenu_chiffre=b"Discussion sur la demande d'avis medical. Vous pouvez echanger ici.",
        type="systeme",
    )
    db.add(system_msg)

    db.commit()
    db.refresh(demande)
    db.refresh(conversation)

    return {
        "demande": DemandeAvisMedicalRead.model_validate(demande),
        "conversation_id": conversation.id,
    }


@router.put("/demandes-avis/{demande_id}/refuser", response_model=DemandeAvisMedicalRead)
async def refuser_demande_avis(
    demande_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    demande = db.get(DemandeAvisMedical, demande_id)
    if not demande:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande non trouvée")
    if demande.statut != "en_attente":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cette demande n'est plus disponible")

    if demande.medecin_cible_id:
        if current_user.id != demande.medecin_cible_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'êtes pas le destinataire de cette demande")
    else:
        target_medecins = _find_target_medecins(db, demande.specialite_id, demande.portee)
        target_ids = {m.id for m in target_medecins}
        if current_user.id not in target_ids:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'êtes pas éligible pour cette demande")

    notification_service.send_notification(
        db=db,
        utilisateur_id=demande.medecin_demandeur_id,
        type_notif="demande_avis_refusee",
        canal="in_app",
        titre="Demande d'avis déclinée",
        contenu="Un confrère a décliné votre demande d'avis médical.",
        donnees={"demande_id": str(demande.id)},
    )

    db.commit()
    db.refresh(demande)
    return demande


@router.put("/demandes-avis/{demande_id}/repondre", response_model=DemandeAvisMedicalRead)
async def repondre_demande_avis(
    demande_id: UUID,
    body: dict,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    reponse_text = body.get("reponse", "")
    if not reponse_text or not reponse_text.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La réponse ne peut pas être vide")

    demande = db.get(DemandeAvisMedical, demande_id)
    if not demande:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande non trouvée")
    if demande.statut != "acceptee":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La demande doit être acceptée avant de répondre")
    if demande.medecin_accepteur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seul le médecin ayant accepté peut répondre")

    demande.reponse = reponse_text
    demande.date_reponse = datetime.now(timezone.utc)

    notification_service.send_notification(
        db=db,
        utilisateur_id=demande.medecin_demandeur_id,
        type_notif="demande_avis_repondu",
        canal="in_app",
        titre="Avis médical reçu",
        contenu="Le médecin a rédigé son avis médical.",
        donnees={"demande_id": str(demande.id)},
    )

    db.commit()
    db.refresh(demande)
    return demande


@router.delete("/demandes-avis/{demande_id}", status_code=status.HTTP_204_NO_CONTENT)
async def annuler_demande_avis(
    demande_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin", "admin")),
):
    demande = db.get(DemandeAvisMedical, demande_id)
    if not demande:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande non trouvée")
    if current_user.role == "medecin" and current_user.id != demande.medecin_demandeur_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seul le demandeur peut annuler")

    demande.statut = "annulee"
    db.commit()
    return None

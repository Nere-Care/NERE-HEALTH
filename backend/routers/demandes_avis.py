import json
from datetime import datetime, timezone
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, aliased

from auth import require_role
from db import get_db
from decimal import Decimal

from models import (
    Consultation,
    Conversation,
    DemandeAvisMedical,
    DossierMedical,
    Medecin,
    MedecinSpecialite,
    Message,
    Notification,
    Paiement,
    Patient,
    ProfessionnelAutorise,
    Specialite,
    Structure,
    User,
)
from schemas import DemandeAvisMedicalCreate, DemandeAvisMedicalRead, DemandeAvisCloturerRequest
from services.notification_service import notification_service

router = APIRouter(tags=["demandes_avis"])


def _delete_demande_avis_recue_notification(db: Session, user_id, demande_id):
    """Delete the 'demande_avis_recue' notification for a given user and demand."""
    from models import Notification
    try:
        notifs = db.execute(
            select(Notification).where(
                Notification.utilisateur_id == user_id,
                Notification.type == "demande_avis_recue",
            )
        ).scalars().all()
        for n in notifs:
            payload = n.donnees_supplementaires or {}
            if isinstance(payload, dict) and str(payload.get("demande_id")) == str(demande_id):
                db.delete(n)
    except Exception:
        pass

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

    # Determine caution amount based on target doctor or default
    caution_montant = 5000.0
    if data.medecin_cible_id:
        target_medecin = db.get(Medecin, data.medecin_cible_id)
        if target_medecin and getattr(target_medecin, "tarif_consultation", None):
            try:
                caution_montant = float(target_medecin.tarif_consultation)
            except (ValueError, TypeError):
                caution_montant = 5000.0

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
        caution_montant=caution_montant,
        payeur_type=data.payeur_type or "medecin",
        statut_sequestre="sequestre",
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


@router.post("/demandes-avis/{demande_id}/payer-sequestre", response_model=DemandeAvisMedicalRead)
async def payer_sequestre(
    demande_id: UUID,
    body: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    demande = db.get(DemandeAvisMedical, demande_id)
    if not demande:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande non trouvée")

    if demande.payeur_type == "medecin" and demande.medecin_demandeur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seul le médecin demandeur peut initier le séquestre")

    if demande.statut_sequestre not in (None, "sequestre"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ce séquestre a déjà été payé")

    methode = body.get("methode", "portefeuille_nere")
    caution = float(demande.caution_montant or 5000.0)
    commission = round(caution * 0.10, 2)
    montant_medecin = round(caution - commission, 2)

    from services.wallet_service import debiter_portefeuille, get_solde_portefeuille
    from routers.retraits import _get_solde_disponible

    if methode == "portefeuille_nere":
        solde = _get_solde_disponible(db, current_user.id)
        if Decimal(str(caution)) > solde:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solde portefeuille insuffisant. Disponible: {int(solde)} FCFA",
            )

    import uuid
    ref = f"SEQ-{uuid.uuid4().hex[:12].upper()}"

    # Determine patient_id for the payment record
    patient = db.get(Patient, demande.patient_id)
    patient_user_id = patient.user_id if patient and hasattr(patient, 'user_id') else demande.patient_id

    statut_paiement = "confirme" if methode == "portefeuille_nere" else "initie"
    fournisseur = "interne" if methode == "portefeuille_nere" else "notchpay"

    paiement = Paiement(
        reference=ref,
        demande_avis_id=demande.id,
        patient_id=patient_user_id,
        medecin_id=current_user.id,
        type_paiement="sequestre_avis",
        montant_total=Decimal(str(caution)),
        frais_plateforme=Decimal(str(commission)),
        montant_medecin=Decimal(str(montant_medecin)),
        methode=methode,
        fournisseur=fournisseur,
        statut=statut_paiement,
        telephone_paiement=body.get("telephone"),
    )
    db.add(paiement)

    if methode == "portefeuille_nere":
        demande.statut_sequestre = "sequestre_confirme"
    else:
        demande.statut_sequestre = "sequestre_initie"

    notification_service.send_notification(
        db=db,
        utilisateur_id=current_user.id,
        type_notif="confirmation_paiement",
        canal="in_app",
        titre=f"Séquestre de {int(caution)} FCFA retenu",
        contenu=f"La plateforme Nere Health retient {int(caution)} FCFA pour garantir votre demande d'avis médicale. Ce montant vous sera remboursé ou ajusté lors de la clôture.",
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
    accepteur_user = aliased(User, name="accepteur_user")

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
            accepteur_user.prenom.label("accepteur_prenom"),
            accepteur_user.nom.label("accepteur_nom"),
        )
        .join(demandeur_user, DemandeAvisMedical.medecin_demandeur_id == demandeur_user.id)
        .join(Specialite, DemandeAvisMedical.specialite_id == Specialite.id)
        .outerjoin(patient_table, DemandeAvisMedical.patient_id == patient_table.id)
        .outerjoin(patient_user, patient_table.id == patient_user.id)
        .outerjoin(cible_user, DemandeAvisMedical.medecin_cible_id == cible_user.id)
        .outerjoin(accepteur_user, DemandeAvisMedical.medecin_accepteur_id == accepteur_user.id)
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

        # For doctor user (non-demandeur), skip if doctor has already declined this broadcast request
        if current_user.role == "medecin" and d.medecin_demandeur_id != current_user.id:
            refused_list = []
            if d.medecins_refuses:
                try:
                    refused_list = json.loads(d.medecins_refuses)
                except Exception:
                    refused_list = []
            if str(current_user.id) in refused_list:
                continue

        d.demandeur_prenom = row[1]
        d.demandeur_nom = row[2]
        d.specialite_libelle = row[3]
        d.patient_prenom = row[4]
        d.patient_nom = row[5]
        d.cible_prenom = row[6]
        d.cible_nom = row[7]
        d.accepteur_prenom = row[8]
        d.accepteur_nom = row[9]

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
        if current_user.id == demande.medecin_demandeur_id:
            pass
        elif demande.medecin_cible_id:
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

    # Delete received request notification for current_user upon refusal
    _delete_demande_avis_recue_notification(db, current_user.id, demande_id)

    if demande.medecin_cible_id:
        if current_user.id != demande.medecin_cible_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'êtes pas le destinataire de cette demande")
        demande.statut = "refusee"

        notification_service.send_notification(
            db=db,
            utilisateur_id=demande.medecin_demandeur_id,
            type_notif="demande_avis_refusee",
            canal="in_app",
            titre="Demande d'avis déclinée",
            contenu="Le confrère sollicité a décliné votre demande d'avis médical.",
            donnees={"demande_id": str(demande.id)},
        )
    else:
        target_medecins = _find_target_medecins(db, demande.specialite_id, demande.portee)
        target_ids = {m.id for m in target_medecins if m.id != demande.medecin_demandeur_id}
        if current_user.id not in target_ids and current_user.id not in {m.id for m in target_medecins}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous n'êtes pas éligible pour cette demande")

        refused_list = []
        if demande.medecins_refuses:
            try:
                refused_list = json.loads(demande.medecins_refuses)
            except Exception:
                refused_list = []

        str_user_id = str(current_user.id)
        if str_user_id not in refused_list:
            refused_list.append(str_user_id)
        demande.medecins_refuses = json.dumps(refused_list)

        # Check if ALL targeted doctors have now declined
        target_id_strs = {str(mid) for mid in target_ids}
        if target_id_strs and target_id_strs.issubset(set(refused_list)):
            demande.statut = "refusee"
            notification_service.send_notification(
                db=db,
                utilisateur_id=demande.medecin_demandeur_id,
                type_notif="demande_avis_refusee",
                canal="in_app",
                titre="Demande d'avis non pourvue",
                contenu="Aucun des confrères sollicités pour votre demande d'avis diffusée n'était disponible.",
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


@router.post("/demandes-avis/{demande_id}/cloturer", response_model=DemandeAvisMedicalRead)
async def cloturer_demande_avis(
    demande_id: UUID,
    body: DemandeAvisCloturerRequest,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    demande = db.get(DemandeAvisMedical, demande_id)
    if not demande:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande non trouvée")
    if demande.medecin_accepteur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seul le médecin expert ayant accepté peut clôturer l'avis")

    demande.compte_rendu = body.compte_rendu
    demande.reponse = body.compte_rendu
    demande.date_reponse = datetime.now(timezone.utc)

    montant = max(0.0, float(body.montant))
    caution = float(demande.caution_montant or 5000.0)
    demande.montant_facture = montant
    demande.statut = "cloturee"

    # Resolve patient user_id for Paiement records
    patient = db.get(Patient, demande.patient_id) if demande.patient_id else None
    patient_user_id = patient.user_id if patient and hasattr(patient, "user_id") else demande.patient_id

    # Expert medecin (accepteur) for Paiement records
    expert_id = demande.medecin_accepteur_id or current_user.id
    demandeur_id = demande.medecin_demandeur_id

    import uuid as _uuid
    from datetime import datetime as _dt

    def _ref():
        return f"CLT-{_uuid.uuid4().hex[:10].upper()}"

    from services.wallet_service import debiter_portefeuille, crediter_portefeuille

    if montant <= 0:
        # Avis gratuit: 100% of caution is refunded to payer
        demande.facture_statut = "gratuit"
        demande.statut_sequestre = "rembourse"
        demande.montant_commission = 0.0

        # Record refund for requesting doctor if sequestre was paid
        if demande.statut_sequestre not in ("sequestre", None):
            paiement_remb = Paiement(
                reference=_ref(),
                demande_avis_id=demande.id,
                patient_id=patient_user_id,
                medecin_id=demandeur_id,
                type_paiement="remboursement_sequestre",
                montant_total=Decimal(str(caution)),
                frais_plateforme=Decimal("0"),
                montant_medecin=Decimal(str(caution)),
                methode="portefeuille_nere",
                fournisseur="interne",
                statut="confirme",
                motif_remboursement="Avis médical gratuit — remboursement total du séquestre",
            )
            db.add(paiement_remb)
            crediter_portefeuille(db, demandeur_id, Decimal(str(caution)))

        notification_service.send_notification(
            db=db,
            utilisateur_id=demande.medecin_demandeur_id,
            type_notif="demande_avis_repondu",
            canal="in_app",
            titre="Avis clôturé (Gratuit)",
            contenu=f"Le médecin expert a rendu son avis à titre confraternel (Gratuit). La caution de {int(caution)} FCFA a été remboursée.",
            donnees={"demande_id": str(demande.id)},
        )
    else:
        # Avis payant: Escrow settlement + 10% platform commission + surplus refund
        commission = round(montant * 0.10, 2)
        net_expert = round(montant - commission, 2)
        reliquat = max(0.0, round(caution - montant, 2))

        demande.facture_statut = "payee"
        demande.statut_sequestre = "libere"
        demande.montant_commission = commission

        # 1) Expert net payout record
        paiement_expert = Paiement(
            reference=_ref(),
            demande_avis_id=demande.id,
            patient_id=patient_user_id,
            medecin_id=expert_id,
            type_paiement="honoraires_avis",
            montant_total=Decimal(str(montant)),
            frais_plateforme=Decimal(str(commission)),
            taux_commission=Decimal("0.1000"),
            montant_medecin=Decimal(str(net_expert)),
            methode="portefeuille_nere",
            fournisseur="interne",
            statut="confirme",
        )
        db.add(paiement_expert)
        crediter_portefeuille(db, expert_id, Decimal(str(net_expert)))

        # 2) Surplus refund to requesting doctor (if any)
        if reliquat > 0:
            paiement_remb = Paiement(
                reference=_ref(),
                demande_avis_id=demande.id,
                patient_id=patient_user_id,
                medecin_id=demandeur_id,
                type_paiement="remboursement_sequestre",
                montant_total=Decimal(str(reliquat)),
                frais_plateforme=Decimal("0"),
                montant_medecin=Decimal(str(reliquat)),
                methode="portefeuille_nere",
                fournisseur="interne",
                statut="confirme",
                motif_remboursement=f"Reliquat séquestre — avis facturé {int(montant)} FCFA sur {int(caution)} FCFA séquestrés",
            )
            db.add(paiement_remb)
            crediter_portefeuille(db, demandeur_id, Decimal(str(reliquat)))

        msg = f"Avis clôturé. Honoraires : {int(montant)} FCFA (dont {int(commission)} FCFA frais Nere)."
        if reliquat > 0:
            msg += f" Reliquat de {int(reliquat)} FCFA remboursé sur votre compte."

        notification_service.send_notification(
            db=db,
            utilisateur_id=demande.medecin_demandeur_id,
            type_notif="demande_avis_repondu",
            canal="in_app",
            titre=f"Avis médical clôturé ({int(montant)} FCFA)",
            contenu=msg,
            donnees={"demande_id": str(demande.id)},
        )

        notification_service.send_notification(
            db=db,
            utilisateur_id=current_user.id,
            type_notif="confirmation_paiement",
            canal="in_app",
            titre="Honoraires crédités",
            contenu=f"Vos honoraires de {int(net_expert)} FCFA (net après commission de {int(commission)} FCFA) ont été crédités.",
            donnees={"demande_id": str(demande.id)},
        )

    db.commit()
    db.refresh(demande)
    return demande


@router.post("/demandes-avis/{demande_id}/payer-par-medecin", response_model=DemandeAvisMedicalRead)
async def payer_avis_par_medecin(
    demande_id: UUID,
    body: dict = Body(default={}),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    import uuid as _uuid
    demande = db.get(DemandeAvisMedical, demande_id)
    if not demande:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande non trouvée")
    if demande.medecin_demandeur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seul le médecin demandeur peut régler cette facture")

    montant = float(demande.montant_facture or 0)
    methode = body.get("methode", "portefeuille_nere")
    commission = round(montant * 0.10, 2)
    montant_net = round(montant - commission, 2)

    from services.wallet_service import debiter_portefeuille, get_solde_portefeuille
    from routers.retraits import _get_solde_disponible

    if methode == "portefeuille_nere":
        solde = _get_solde_disponible(db, current_user.id)
        if Decimal(str(montant)) > solde:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Solde portefeuille insuffisant. Disponible: {int(solde)} FCFA",
            )

    ref = f"HON-{_uuid.uuid4().hex[:12].upper()}"

    patient = db.get(Patient, demande.patient_id)
    patient_user_id = patient.id if patient else demande.patient_id

    statut_paiement = "confirme" if methode == "portefeuille_nere" else "initie"
    fournisseur = "interne" if methode == "portefeuille_nere" else "notchpay"

    paiement = Paiement(
        reference=ref,
        demande_avis_id=demande.id,
        patient_id=patient_user_id,
        medecin_id=current_user.id,
        type_paiement="honoraires_avis",
        montant_total=Decimal(str(montant)),
        devise="XAF",
        frais_plateforme=Decimal(str(commission)),
        montant_medecin=Decimal(str(montant_net)),
        methode=methode,
        fournisseur=fournisseur,
        statut=statut_paiement,
        telephone_paiement=body.get("telephone") if methode in ("mtn_momo", "orange_money") else None,
        derniers_4_chiffres=body.get("derniers_4_chiffres") if methode == "carte_visa" else None,
    )
    db.add(paiement)

    if methode == "portefeuille_nere":
        debiter_portefeuille(db, current_user.id, Decimal(str(montant)))

    demande.statut = "cloturee"
    demande.facture_statut = "payee"
    demande.payeur_type = "medecin"

    if demande.medecin_accepteur_id:
        notification_service.send_notification(
            db=db,
            utilisateur_id=demande.medecin_accepteur_id,
            type_notif="confirmation_paiement",
            canal="in_app",
            titre="Honoraires réglés",
            contenu=f"Le confrère a réglé la facture de {int(montant)} FCFA ({methode}) pour l'avis médical. Commission plateforme: {int(commission)} FCFA.",
            donnees={"demande_id": str(demande.id)},
        )

    db.commit()
    db.refresh(demande)
    return demande


@router.post("/demandes-avis/{demande_id}/transferer-au-patient", response_model=DemandeAvisMedicalRead)
async def transferer_avis_au_patient(
    demande_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("medecin")),
):
    demande = db.get(DemandeAvisMedical, demande_id)
    if not demande:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande non trouvée")
    if demande.medecin_demandeur_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seul le médecin demandeur peut transférer la facture")

    demande.statut = "en_attente_paiement_patient"
    demande.payeur_type = "patient"

    notification_service.send_notification(
        db=db,
        utilisateur_id=demande.patient_id,
        type_notif="demande_avis_recue",
        canal="in_app",
        titre=f"Facture d'avis médical : {int(demande.montant_facture or 0)} FCFA",
        contenu=f"Une facture de {int(demande.montant_facture or 0)} FCFA a été émise pour l'avis médical spécialisé de votre dossier.",
        donnees={"demande_id": str(demande.id)},
    )

    db.commit()
    db.refresh(demande)
    return demande


@router.post("/demandes-avis/{demande_id}/payer-par-patient", response_model=DemandeAvisMedicalRead)
async def payer_avis_par_patient(
    demande_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("patient")),
):
    demande = db.get(DemandeAvisMedical, demande_id)
    if not demande:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demande non trouvée")
    if demande.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé")

    montant = float(demande.montant_facture or 0)
    if montant <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucune facture à régler")

    import uuid as _uuid
    ref = f"PAT-{_uuid.uuid4().hex[:12].upper()}"

    patient = db.get(Patient, demande.patient_id)
    patient_user_id = patient.user_id if patient and hasattr(patient, "user_id") else demande.patient_id

    paiement = Paiement(
        reference=ref,
        demande_avis_id=demande.id,
        patient_id=patient_user_id,
        medecin_id=demande.medecin_accepteur_id,
        type_paiement="paiement_avis_patient",
        montant_total=Decimal(str(montant)),
        frais_plateforme=Decimal("0"),
        montant_medecin=Decimal(str(montant)),
        methode="portefeuille_nere",
        fournisseur="interne",
        statut="confirme",
    )
    db.add(paiement)

    demande.statut = "cloturee"
    demande.facture_statut = "payee"
    demande.payeur_type = "patient"

    if demande.medecin_demandeur_id:
        notification_service.send_notification(
            db=db,
            utilisateur_id=demande.medecin_demandeur_id,
            type_notif="confirmation_paiement",
            canal="in_app",
            titre="Facture réglée par le patient",
            contenu=f"Le patient a réglé la facture de {int(montant)} FCFA pour l'avis médical.",
            donnees={"demande_id": str(demande.id)},
        )

    if demande.medecin_accepteur_id:
        notification_service.send_notification(
            db=db,
            utilisateur_id=demande.medecin_accepteur_id,
            type_notif="confirmation_paiement",
            canal="in_app",
            titre="Honoraires réglés par le patient",
            contenu=f"Le patient a réglé la facture de {int(montant)} FCFA pour votre avis médical.",
            donnees={"demande_id": str(demande.id)},
        )

    db.commit()
    db.refresh(demande)
    return demande


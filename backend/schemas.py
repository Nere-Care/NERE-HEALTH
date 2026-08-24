from datetime import date, datetime, time
from decimal import Decimal
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator


class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    requires_2fa: Optional[bool] = False
    totp_token: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    prenom: str
    nom: str
    telephone: Optional[str] = None
    role: Optional[str] = "patient"


class UserUpdate(BaseModel):
    prenom: Optional[str] = None
    nom: Optional[str] = None
    telephone: Optional[str] = None
    photo_url: Optional[str] = None
    timezone: Optional[str] = None
    adresse: Optional[str] = None
    date_naissance: Optional[date] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class VerifyEmailRequest(BaseModel):
    token: str


class VerifyEmailCodeRequest(BaseModel):
    email: EmailStr
    code: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr | None = None
    token: str | None = None


class TwoFactorVerifyRequest(BaseModel):
    code: str
    totp_token: str


class TwoFactorCodeRequest(BaseModel):
    code: str


class PatientRegister(UserCreate):
    date_naissance: Optional[date] = None
    sexe: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    region: Optional[str] = None
    pays: Optional[str] = "CM"
    profession: Optional[str] = None
    statut_matrimonial: Optional[str] = None
    contact_urgence_nom: Optional[str] = None
    contact_urgence_tel: Optional[str] = None
    contact_urgence2_nom: Optional[str] = None
    contact_urgence2_tel: Optional[str] = None
    proche_nom: Optional[str] = None
    proche_prenom: Optional[str] = None
    proche_age: Optional[int] = None
    consentement_donnees: Optional[bool] = False


class MedecinRegister(UserCreate):
    numero_ordre: str
    annees_experience: Optional[int] = 0
    biographie: Optional[str] = None
    date_naissance: Optional[date] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    district: Optional[str] = None
    langues_parlees: Optional[List[str]] = ["fr"]
    tarif_consultation: Optional[Decimal] = Decimal("5000.00")
    specialites: Optional[List[str]] = None
    structure_nom: Optional[str] = None


class UserRead(UserBase):
    id: UUID
    role: Optional[str] = None
    prenom: Optional[str] = None
    nom: Optional[str] = None
    telephone: Optional[str] = None
    photo_url: Optional[str] = None
    statut: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool
    email_verifie: Optional[bool] = None
    totp_actif: Optional[bool] = None
    timezone: Optional[str] = None
    adresse: Optional[str] = None
    date_naissance: Optional[date] = None

    model_config = {"from_attributes": True}


class PatientBase(BaseModel):
    code_patient: Optional[str] = None
    nss: Optional[str] = None
    sexe: Optional[str] = None
    ville: Optional[str] = None
    groupe_sanguin: Optional[str] = None
    region: Optional[str] = None
    pays: Optional[str] = None
    code_postal: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    couverture_assurance: Optional[str] = None
    numero_assurance: Optional[str] = None
    profession: Optional[str] = None
    statut_matrimonial: Optional[str] = None
    organisme_assurance: Optional[str] = None
    contact_urgence_nom: Optional[str] = None
    contact_urgence_tel: Optional[str] = None
    contact_urgence_lien: Optional[str] = None
    contact_urgence2_nom: Optional[str] = None
    contact_urgence2_tel: Optional[str] = None
    contact_urgence2_lien: Optional[str] = None
    proche_nom: Optional[str] = None
    proche_prenom: Optional[str] = None
    proche_age: Optional[int] = None
    proches: Optional[List[dict]] = None
    consentement_donnees: Optional[bool] = False
    date_consentement: Optional[datetime] = None
    consentement_marketing: Optional[bool] = False
    acces_dossier: Optional[str] = "standard"
    partage_anonyme: Optional[bool] = True


class PatientCreate(PatientBase):
    pass


class PatientUpdate(BaseModel):
    code_patient: Optional[str] = None
    nss: Optional[str] = None
    date_naissance: Optional[date] = None
    sexe: Optional[str] = None
    groupe_sanguin: Optional[str] = None
    taille_cm: Optional[float] = None
    poids_kg: Optional[float] = None
    adresse: Optional[str] = None
    region: Optional[str] = None
    pays: Optional[str] = None
    code_postal: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    couverture_assurance: Optional[str] = None
    numero_assurance: Optional[str] = None
    profession: Optional[str] = None
    statut_matrimonial: Optional[str] = None
    organisme_assurance: Optional[str] = None
    contact_urgence_nom: Optional[str] = None
    contact_urgence_tel: Optional[str] = None
    contact_urgence_lien: Optional[str] = None
    contact_urgence2_nom: Optional[str] = None
    contact_urgence2_tel: Optional[str] = None
    contact_urgence2_lien: Optional[str] = None
    proche_nom: Optional[str] = None
    proche_prenom: Optional[str] = None
    proche_age: Optional[int] = None
    proches: Optional[List[dict]] = None
    consentement_donnees: Optional[bool] = None
    date_consentement: Optional[datetime] = None
    consentement_marketing: Optional[bool] = None
    acces_dossier: Optional[str] = None
    partage_anonyme: Optional[bool] = None


class PatientRead(PatientBase):
    id: UUID
    nom: Optional[str] = None
    prenom: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None
    photo_url: Optional[str] = None
    date_naissance: Optional[date] = None
    adresse: Optional[str] = None
    taille_cm: Optional[float] = None
    poids_kg: Optional[float] = None
    acces_dossier: Optional[str] = "standard"
    acces_restricted: Optional[bool] = None
    partage_anonyme: Optional[bool] = True
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProfessionnelAutoriseRead(BaseModel):
    id: UUID
    patient_id: UUID
    medecin_id: UUID
    medecin_nom: Optional[str] = None
    medecin_prenom: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfessionnelAutoriseCreate(BaseModel):
    medecin_id: UUID


class ConsultationBase(BaseModel):
    numero_consultation: Optional[str] = None
    rdv_id: UUID
    dossier_id: Optional[UUID] = None
    medecin_id: Optional[UUID] = None
    patient_id: UUID
    date_heure_debut: Optional[datetime] = None
    date_heure_fin: Optional[datetime] = None
    duree_minutes: Optional[int] = None
    motif: str
    anamnese: Optional[str] = None
    examen_clinique: Optional[str] = None
    diagnostic_principal: Optional[str] = None
    code_cim10: Optional[str] = None
    diagnostics_secondaires: Optional[List[str]] = None
    plan_traitement: Optional[str] = None
    prescription_nom: Optional[str] = None
    prescription_posologie: Optional[str] = None
    demandes_labo: Optional[str] = None
    observations: Optional[str] = None
    suivi_necessaire: Optional[bool] = False
    date_prochain_rdv: Optional[date] = None
    instructions_patient: Optional[str] = None
    transcription_ia: Optional[str] = None
    resume_ia: Optional[str] = None
    statut: Optional[str] = "en_cours"


class ConsultationCreate(ConsultationBase):
    pass


class ConsultationRead(ConsultationBase):
    id: UUID
    medecin: Optional["UserRead"] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrdonnanceLigneBase(BaseModel):
    ordre: Optional[int] = 1
    medicament_nom: str
    dci: Optional[str] = None
    classe_therapeutique: Optional[str] = None
    dosage: Optional[str] = None
    forme: Optional[str] = None
    posologie: Optional[str] = None
    frequence_par_jour: Optional[int] = 1
    duree_jours: Optional[int] = None
    quantite: Optional[int] = None
    avant_repas: Optional[bool] = None
    heure_prise: Optional[List[str]] = None
    instructions_speciales: Optional[str] = None
    interactions_a_eviter: Optional[str] = None


class OrdonnanceLigneCreate(OrdonnanceLigneBase):
    pass


class OrdonnanceLigneRead(OrdonnanceLigneBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class OrdonnanceBase(BaseModel):
    numero: str
    consultation_id: Optional[UUID] = None
    medecin_id: Optional[UUID] = None
    medecin_nom_libre: Optional[str] = None
    patient_id: UUID
    motif: Optional[str] = None
    type_consultation: Optional[str] = None
    type_ordonnance: Optional[str] = None
    structure_nom: Optional[str] = None
    adresse_structure: Optional[str] = None
    date_emission: Optional[date] = None
    date_expiration: Optional[date] = None
    statut: Optional[str] = "active"
    date_utilisation: Optional[datetime] = None
    pharmacie_utilisee: Optional[str] = None
    qr_code_data: str
    qr_code_url: Optional[str] = None
    code_pharmacie: Optional[str] = None
    signature_numerique: Optional[str] = None
    hash_integrite: Optional[str] = None
    pdf_url: Optional[str] = None
    notes_medecin: Optional[str] = None
    renouvelable: Optional[bool] = False
    nb_renouvellements_max: Optional[int] = 0
    nb_renouvellements: Optional[int] = 0
    date_debut_traitement: Optional[date] = None
    statut_traitement: Optional[str] = None
    date_arret_traitement: Optional[date] = None
    motif_arret_traitement: Optional[str] = None
    lignes: Optional[List[OrdonnanceLigneCreate]] = None


class OrdonnanceCreate(OrdonnanceBase):
    pass


class StatutTraitementUpdate(BaseModel):
    statut_traitement: str
    date_debut_traitement: Optional[date] = None
    date_arret_traitement: Optional[date] = None
    motif_arret_traitement: Optional[str] = None


class OrdonnanceRead(OrdonnanceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    lignes: Optional[List[OrdonnanceLigneRead]] = None

    model_config = {"from_attributes": True}


class PriseMedicamentBase(BaseModel):
    ordonnance_id: UUID
    medicament_nom: str
    date_prise_prevue: date
    heure_prise_prevue: Optional[str] = None
    moment_journee: str

    @field_validator("heure_prise_prevue", mode="before")
    @classmethod
    def _fmt_heure(cls, val):
        if hasattr(val, "strftime"):
            return val.strftime("%H:%M")
        return val


class PriseMedicamentCreate(PriseMedicamentBase):
    pass


class PriseMedicamentUpdate(BaseModel):
    statut: str
    date_prise_effective: Optional[datetime] = None


class PriseMedicamentRead(PriseMedicamentBase):
    id: UUID
    statut: str
    date_prise_effective: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaiementBase(BaseModel):
    reference: str
    rdv_id: Optional[UUID] = None
    demande_avis_id: Optional[UUID] = None
    patient_id: UUID
    medecin_id: UUID
    type_paiement: Optional[str] = "consultation"
    montant_total: Decimal
    devise: Optional[str] = "XAF"
    frais_plateforme: Optional[Decimal] = Decimal("0")
    taux_commission: Optional[Decimal] = Decimal("0.1000")
    montant_medecin: Optional[Decimal] = None
    methode: str
    fournisseur: str
    statut: Optional[str] = "initie"
    reference_fournisseur: Optional[str] = None
    transaction_id_externe: Optional[str] = None
    url_paiement: Optional[str] = None
    date_remboursement: Optional[datetime] = None
    motif_remboursement: Optional[str] = None
    montant_rembourse: Optional[Decimal] = None
    reference_remboursement: Optional[str] = None
    webhook_data: Optional[Dict[str, object]] = None
    webhook_signature: Optional[str] = None
    reversi_effectue: Optional[bool] = False
    date_reversement: Optional[datetime] = None
    reference_reversement: Optional[str] = None
    ip_paiement: Optional[str] = None
    user_agent_paiement: Optional[str] = None
    telephone_paiement: Optional[str] = None
    derniers_4_chiffres: Optional[str] = None
    date_expiration: Optional[datetime] = None


class PaiementCreate(PaiementBase):
    pass


class PaiementRead(PaiementBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaiementInitierRequest(BaseModel):
    methode: str  # mtn_momo | orange_money | carte_visa | carte_mastercard
    telephone: Optional[str] = None
    email: Optional[str] = None
    derniers_4_chiffres: Optional[str] = None


class PaiementValiderRequest(BaseModel):
    statut: str  # valide_manuellement | echoue
    motif: Optional[str] = None


class RetraitBase(BaseModel):
    medecin_id: UUID
    montant: Decimal
    devise: Optional[str] = "XAF"
    methode: str  # mtn_momo | orange_money | virement_bancaire
    reference: Optional[str] = None
    compte: Optional[str] = None


class RetraitCreate(BaseModel):
    montant: Decimal
    devise: Optional[str] = "XAF"
    methode: str
    reference: Optional[str] = None
    compte: Optional[str] = None


class RetraitRead(RetraitBase):
    id: UUID
    statut: str
    motif_rejet: Optional[str] = None
    admin_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RetraitValiderRequest(BaseModel):
    statut: str  # valide | rejete | effectue
    motif_rejet: Optional[str] = None
    reference: Optional[str] = None


class NotificationBase(BaseModel):
    utilisateur_id: UUID
    type: str
    canal: Optional[str] = "in_app"
    statut: Optional[str] = "en_attente"
    titre: str
    contenu: str
    donnees_supplementaires: Optional[Dict[str, object]] = None
    date_envoi_planifie: Optional[datetime] = None
    date_envoi_reel: Optional[datetime] = None
    date_lecture: Optional[datetime] = None
    nb_tentatives: Optional[int] = 0
    derniere_erreur: Optional[str] = None
    prochaine_tentative: Optional[datetime] = None
    reference_externe: Optional[str] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationRead(NotificationBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class DossierMedicalBase(BaseModel):
    numero_dossier: str
    patient_id: UUID
    medecin_traitant_id: Optional[UUID] = None
    antecedents_familiaux: Optional[str] = None
    antecedents_personnels: Optional[str] = None
    antecedents_chirurgicaux: Optional[str] = None
    antecedents_allergiques: Optional[str] = None
    antecedents_gyneco: Optional[str] = None
    habitudes_vie: Optional[dict] = None
    taille_cm: Optional[Decimal] = None
    poids_kg: Optional[Decimal] = None
    imc: Optional[Decimal] = None
    tension_arterielle: Optional[str] = None
    glycemie_a_jeun: Optional[Decimal] = None
    vaccinations: Optional[list[dict]] = None
    traitements_chroniques: Optional[list[dict]] = None
    code_partage: Optional[str] = None
    code_partage_expires: Optional[datetime] = None


class DossierMedicalCreate(DossierMedicalBase):
    numero_dossier: Optional[str] = None

class DossierMedicalUpdate(BaseModel):
    numero_dossier: Optional[str] = None
    patient_id: Optional[UUID] = None
    medecin_traitant_id: Optional[UUID] = None
    antecedents_familiaux: Optional[str] = None
    antecedents_personnels: Optional[str] = None
    antecedents_chirurgicaux: Optional[str] = None
    antecedents_allergiques: Optional[str] = None
    antecedents_gyneco: Optional[str] = None
    habitudes_vie: Optional[dict] = None
    taille_cm: Optional[Decimal] = None
    poids_kg: Optional[Decimal] = None
    imc: Optional[Decimal] = None
    tension_arterielle: Optional[str] = None
    glycemie_a_jeun: Optional[Decimal] = None
    vaccinations: Optional[list[dict]] = None
    traitements_chroniques: Optional[list[dict]] = None
    code_partage: Optional[str] = None
    code_partage_expires: Optional[datetime] = None


class DossierMedicalRead(DossierMedicalBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    acces_restricted: Optional[bool] = None
    groupe_sanguin: Optional[str] = None

    model_config = {"from_attributes": True}


class RendezVousBase(BaseModel):
    numero_rdv: Optional[str] = None
    patient_id: UUID
    medecin_id: UUID
    structure_id: Optional[UUID] = None
    date_heure_debut: datetime
    date_heure_fin: datetime
    type: str
    statut: Optional[str] = "en_attente"
    motif_consultation: Optional[str] = None
    symptomes_declares: Optional[list[str]] = None
    notes_patient: Optional[str] = None
    notes_pre_consultation: Optional[str] = None
    lien_video: Optional[str] = None
    webrtc_room_id: Optional[str] = None
    token_patient: Optional[str] = None
    token_medecin: Optional[str] = None
    montant: Optional[Decimal] = Decimal("0")
    devise: Optional[str] = "XAF"
    annule_par: Optional[UUID] = None
    motif_annulation: Optional[str] = None
    date_annulation: Optional[datetime] = None
    rappel_j1_envoye: Optional[bool] = False
    rappel_h1_envoye: Optional[bool] = False
    note_patient: Optional[int] = None
    commentaire_patient: Optional[str] = None


class RendezVousCreate(RendezVousBase):
    pass


class RendezVousRead(RendezVousBase):
    id: UUID
    code_verification: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AvisBase(BaseModel):
    patient_id: UUID
    medecin_id: UUID
    rdv_id: UUID
    note: int
    commentaire: Optional[str] = None
    verifie: Optional[bool] = False
    verifie_par: Optional[UUID] = None
    masque: Optional[bool] = False
    motif_masquage: Optional[str] = None
    reponse_medecin: Optional[str] = None
    date_reponse: Optional[datetime] = None


class AvisCreate(AvisBase):
    pass


class AvisRead(AvisBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    patient_prenom: Optional[str] = None
    patient_nom: Optional[str] = None

    model_config = {"from_attributes": True}


class ChatbotSessionBase(BaseModel):
    patient_id: Optional[UUID] = None
    messages: Optional[List[Dict[str, object]]] = None
    symptomes_detectes: Optional[List[str]] = None
    specialite_suggeree: Optional[str] = None
    niveau_urgence: Optional[str] = "faible"
    redirection_rdv: Optional[bool] = False
    rdv_cree_id: Optional[UUID] = None
    modele_ia: Optional[str] = "gpt-4o-mini"
    tokens_utilises: Optional[int] = 0
    cout_estime_usd: Optional[Decimal] = Decimal("0")
    statut: Optional[str] = "active"


class ChatbotSessionCreate(ChatbotSessionBase):
    pass


class ChatbotSessionRead(ChatbotSessionBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationBase(BaseModel):
    patient_id: Optional[UUID] = None
    medecin_id: Optional[UUID] = None
    rdv_id: Optional[UUID] = None
    demande_avis_id: Optional[UUID] = None
    statut: Optional[str] = "active"
    nb_messages_non_lus_patient: Optional[int] = 0
    nb_messages_non_lus_medecin: Optional[int] = 0
    dernier_message_at: Optional[datetime] = None
    dernier_message_preview: Optional[str] = None


class ConversationCreate(ConversationBase):
    pass


class ConversationRead(ConversationBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    medecin_nom: Optional[str] = None
    patient_nom: Optional[str] = None
    other_medecin_nom: Optional[str] = None
    demande_medecin_demandeur_nom: Optional[str] = None
    demande_medecin_cible_nom: Optional[str] = None
    demande_medecin_demandeur_id: Optional[UUID] = None
    demande_medecin_cible_id: Optional[UUID] = None
    demande_medecin_accepteur_id: Optional[UUID] = None
    demande_dossier_medical_id: Optional[UUID] = None
    demande_consultation_id: Optional[UUID] = None
    demande_motif: Optional[str] = None
    demande_specialite: Optional[str] = None
    demande_patient_nom: Optional[str] = None
    demande_patient_id: Optional[UUID] = None
    demande_statut: Optional[str] = None
    demande_montant_facture: Optional[float] = None
    demande_caution_montant: Optional[float] = None

    model_config = {"from_attributes": True}


class SignalementCreate(BaseModel):
    conversation_id: UUID
    motif: str
    details: Optional[str] = None


class SignalementRead(BaseModel):
    id: UUID
    conversation_id: UUID
    signalant_id: UUID
    signalant_role: str
    motif: str
    details: Optional[str] = None
    statut: str
    created_at: datetime
    conversation_signalee_par: Optional[str] = None

    model_config = {"from_attributes": True}


class DisponibiliteBase(BaseModel):
    medecin_id: UUID
    jour_semaine: str
    heure_debut: time
    heure_fin: time
    duree_creneau_minutes: Optional[int] = 30
    type: Optional[str] = "video"
    recurrence: Optional[str] = "hebdomadaire"
    date_debut_validite: Optional[date] = None
    date_fin_validite: Optional[date] = None
    exceptions: Optional[List[date]] = None
    actif: Optional[bool] = True


class DisponibiliteCreate(DisponibiliteBase):
    pass


class DisponibiliteRead(DisponibiliteBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DocumentMedicalBase(BaseModel):
    patient_id: UUID
    consultation_id: Optional[UUID] = None
    medecin_uploadeur_id: Optional[UUID] = None
    uploaded_par: Optional[UUID] = None
    type_document: str
    nom_fichier_original: str
    nom_fichier_stockage: str
    url_stockage: str
    checksum_sha256: str
    taille_octets: int
    mime_type: str
    est_chiffre: Optional[bool] = True
    cle_chiffrement_ref: Optional[str] = None
    partage_avec_medecins: Optional[List[UUID]] = None
    visible_patient: Optional[bool] = True
    description: Optional[str] = None
    date_document: Optional[date] = None
    laboratoire_nom: Optional[str] = None
    adresse_structure: Optional[str] = None
    prescripteur_nom: Optional[str] = None


class DocumentMedicalCreate(DocumentMedicalBase):
    pass


class DocumentMedicalRead(DocumentMedicalBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MedecinSpecialiteBase(BaseModel):
    medecin_id: UUID
    specialite_id: UUID
    principale: Optional[bool] = False
    annees_pratique: Optional[int] = 0
    certifie: Optional[bool] = False


class MedecinSpecialiteCreate(MedecinSpecialiteBase):
    pass


class MedecinSpecialiteRead(MedecinSpecialiteBase):
    medecin_id: UUID
    specialite_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class MedecinBase(BaseModel):
    id: UUID
    code_medecin: Optional[str] = None
    numero_ordre: str
    statut_verification: Optional[str] = "en_attente"
    date_verification: Optional[datetime] = None
    verifie_par_admin_id: Optional[UUID] = None
    annees_experience: Optional[int] = 0
    biographie: Optional[str] = None
    presentation: Optional[str] = None
    expertises: Optional[List[Dict[str, object]]] = None
    actes: Optional[List[Dict[str, object]]] = None
    diplomes: Optional[List[Dict[str, object]]] = None
    certifications: Optional[List[Dict[str, object]]] = None
    experience_history: Optional[List[Dict[str, object]]] = None
    documents: Optional[List[Dict[str, object]]] = None
    langues_parlees: Optional[List[str]] = None
    tarif_consultation: Optional[Decimal] = Decimal("5000.00")
    tarif_modification: Optional[Dict[str, object]] = None
    structure_modification: Optional[Dict[str, object]] = None
    methodes_retrait: Optional[List[Dict[str, object]]] = None
    devise: Optional[str] = "XAF"
    teleconsultation_active: Optional[bool] = True
    note_moyenne: Optional[Decimal] = Decimal("0.00")
    nombre_avis: Optional[int] = 0
    nombre_consultations: Optional[int] = 0
    structure_id: Optional[UUID] = None
    disponible_maintenant: Optional[bool] = False
    solde_portefeuille: Optional[Decimal] = Decimal("0.00")


class MedecinCreate(MedecinBase):
    pass


class MedecinUpdate(BaseModel):
    numero_ordre: Optional[str] = None
    statut_verification: Optional[str] = None
    date_verification: Optional[datetime] = None
    verifie_par_admin_id: Optional[UUID] = None
    annees_experience: Optional[int] = None
    biographie: Optional[str] = None
    presentation: Optional[str] = None
    expertises: Optional[List[Dict[str, object]]] = None
    actes: Optional[List[Dict[str, object]]] = None
    diplomes: Optional[List[Dict[str, object]]] = None
    certifications: Optional[List[Dict[str, object]]] = None
    experience_history: Optional[List[Dict[str, object]]] = None
    documents: Optional[List[Dict[str, object]]] = None
    langues_parlees: Optional[List[str]] = None
    tarif_consultation: Optional[Decimal] = None
    tarif_modification: Optional[Dict[str, object]] = None
    methodes_retrait: Optional[List[Dict[str, object]]] = None
    devise: Optional[str] = None
    teleconsultation_active: Optional[bool] = None
    note_moyenne: Optional[Decimal] = None
    nombre_avis: Optional[int] = None
    nombre_consultations: Optional[int] = None
    structure_id: Optional[UUID] = None
    solde_portefeuille: Optional[Decimal] = None
    disponible_maintenant: Optional[bool] = None
    specialite: Optional[str] = None
    hopital: Optional[str] = None
    address: Optional[str] = None
    telephone: Optional[str] = None
    email: Optional[str] = None
    date_naissance: Optional[str] = None
    prenom: Optional[str] = None
    nom: Optional[str] = None


class MedecinRead(MedecinBase):
    prenom: Optional[str] = None
    nom: Optional[str] = None
    email: Optional[str] = None
    telephone: Optional[str] = None
    photo_url: Optional[str] = None
    date_naissance: Optional[str] = None
    age: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AdminMedecinCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    specialty: Optional[str] = None
    hospital: Optional[str] = None
    address: Optional[str] = None
    numero_ordre: Optional[str] = None
    role: Optional[str] = "medecin"
    annees_experience: Optional[int] = 0
    date_naissance: Optional[str] = None


class AdminMedecinRead(BaseModel):
    id: UUID
    email: str
    prenom: Optional[str] = None
    nom: Optional[str] = None
    telephone: Optional[str] = None
    mot_de_passe_genere: str
    medecin_id: UUID
    numero_ordre: str

    model_config = {"from_attributes": True}


class MessageBase(BaseModel):
    conversation_id: UUID
    contenu_chiffre: bytes
    type: Optional[str] = "texte"
    fichier_url: Optional[str] = None
    fichier_nom: Optional[str] = None
    fichier_taille: Optional[int] = None
    fichier_mime: Optional[str] = None
    lu_par_destinataire: Optional[bool] = False
    date_lecture: Optional[datetime] = None
    signale: Optional[bool] = False
    supprime_par_expediteur: Optional[bool] = False


class MessageCreate(MessageBase):
    pass


class MessageRead(MessageBase):
    id: UUID
    expediteur_id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionBase(BaseModel):
    utilisateur_id: UUID
    refresh_token_hash: str
    access_token_jti: Optional[str] = None
    ip_address: str
    user_agent: Optional[str] = None
    appareil: Optional[str] = None
    localisation: Optional[str] = None
    plateforme: Optional[str] = None
    expires_at: datetime
    revoque: Optional[bool] = False
    date_revocation: Optional[datetime] = None
    motif_revocation: Optional[str] = None


class SessionCreate(SessionBase):
    pass


class SessionRead(SessionBase):
    id: UUID
    created_at: datetime
    last_used_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class SpecialiteBase(BaseModel):
    code: str
    libelle_fr: str
    libelle_en: Optional[str] = None
    description: Optional[str] = None
    icone_url: Optional[str] = None
    actif: Optional[bool] = True
    ordre_affichage: Optional[int] = 0


class SpecialiteCreate(SpecialiteBase):
    pass


class SpecialiteRead(SpecialiteBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class StructureBase(BaseModel):
    id: Optional[UUID] = None
    nom_etablissement: str
    type: str
    statut_verification: Optional[str] = "en_attente"
    numero_autorisation: Optional[str] = None
    numero_contribuable: Optional[str] = None
    date_creation: Optional[date] = None
    adresse: str
    ville: str
    region: Optional[str] = None
    pays: Optional[str] = "CM"
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    telephone_pro: Optional[str] = None
    email_pro: Optional[str] = None
    site_web: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    horaires_ouverture: Optional[Dict[str, object]] = None
    services_offerts: Optional[List[str]] = None
    equipements: Optional[List[str]] = None
    langues_parlees: Optional[List[str]] = None
    assurances: Optional[List[str]] = None
    responsable: Optional[str] = None
    capacite_lits: Optional[int] = None
    documents: Optional[List[Dict[str, object]]] = None


class StructureCreate(StructureBase):
    pass


class StructureUpdate(BaseModel):
    nom_etablissement: Optional[str] = None
    type: Optional[str] = None
    statut_verification: Optional[str] = None
    numero_autorisation: Optional[str] = None
    numero_contribuable: Optional[str] = None
    date_creation: Optional[date] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    region: Optional[str] = None
    pays: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    telephone_pro: Optional[str] = None
    email_pro: Optional[str] = None
    site_web: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    horaires_ouverture: Optional[Dict[str, object]] = None
    services_offerts: Optional[List[str]] = None
    equipements: Optional[List[str]] = None
    langues_parlees: Optional[List[str]] = None
    assurances: Optional[List[str]] = None
    responsable: Optional[str] = None
    capacite_lits: Optional[int] = None
    documents: Optional[List[Dict[str, object]]] = None


class StructureRead(StructureBase):
    nombre_professionnels: Optional[int] = 0
    created_at: datetime
    updated_at: datetime
    note_moyenne: Optional[float] = None
    total_avis: Optional[int] = None

    model_config = {"from_attributes": True}


class AuditLogRead(BaseModel):
    id: int
    utilisateur_id: Optional[UUID] = None
    role_utilisateur: Optional[str] = None
    session_id: Optional[UUID] = None
    action: str
    entite_type: Optional[str] = None
    entite_id: Optional[UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    endpoint: Optional[str] = None
    methode_http: Optional[str] = None
    donnees_avant: Optional[dict] = None
    donnees_apres: Optional[dict] = None
    succes: bool
    code_http: Optional[int] = None
    message_erreur: Optional[str] = None
    duree_ms: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class AvisStructureCreate(BaseModel):
    structure_id: UUID
    note: int = Field(ge=1, le=5)
    commentaire: Optional[str] = None


class AvisStructureRead(BaseModel):
    id: UUID
    patient_id: UUID
    structure_id: UUID
    note: int
    commentaire: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class DemandeAvisMedicalCreate(BaseModel):
    patient_id: UUID
    specialite_id: UUID
    portee: str = Field(pattern=r"^(cameroun|diaspora)$")
    consultation_id: Optional[UUID] = None
    dossier_medical_id: Optional[UUID] = None
    motif: str
    message: Optional[str] = None
    confidentiel: bool = True
    medecin_cible_id: Optional[UUID] = None
    payeur_type: Optional[str] = "medecin"


class DemandeAvisMedicalRead(BaseModel):
    id: UUID
    medecin_demandeur_id: UUID
    patient_id: UUID
    specialite_id: UUID
    portee: str
    consultation_id: Optional[UUID] = None
    dossier_medical_id: Optional[UUID] = None
    motif: str
    message: Optional[str] = None
    statut: str
    medecin_accepteur_id: Optional[UUID] = None
    medecin_cible_id: Optional[UUID] = None
    reponse: Optional[str] = None
    date_reponse: Optional[datetime] = None
    confidentiel: bool
    medecins_refuses: Optional[str] = "[]"
    montant_facture: Optional[float] = 0.0
    caution_montant: Optional[float] = 5000.0
    montant_commission: Optional[float] = 0.0
    statut_sequestre: Optional[str] = "sequestre"
    payeur_type: Optional[str] = None
    facture_statut: Optional[str] = "gratuit"
    compte_rendu: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    demandeur_prenom: Optional[str] = None
    demandeur_nom: Optional[str] = None
    specialite_libelle: Optional[str] = None
    patient_prenom: Optional[str] = None
    patient_nom: Optional[str] = None
    cible_prenom: Optional[str] = None
    cible_nom: Optional[str] = None
    dossier_numero: Optional[str] = None
    consultation_numero: Optional[str] = None
    consultation_motif: Optional[str] = None

    model_config = {"from_attributes": True}


class DemandeAvisCloturerRequest(BaseModel):
    montant: float = 0.0
    compte_rendu: str



class DocumentStructureCreate(BaseModel):
    nom: str
    type: Optional[str] = None
    taille: Optional[str] = None
    url: Optional[str] = None


class ExceptionDisponibiliteBase(BaseModel):
    medecin_id: Optional[UUID] = None
    date: date
    type: str  # "indisponible" | "horaires_personnalises"
    creneaux: Optional[List[dict]] = None  # [{start: "HH:MM", end: "HH:MM"}]


class ExceptionDisponibiliteCreate(ExceptionDisponibiliteBase):
    pass


class ExceptionDisponibiliteUpdate(BaseModel):
    type: Optional[str] = None
    creneaux: Optional[List[dict]] = None
    date: Optional[str] = None
    actif: Optional[bool] = None


class ExceptionDisponibiliteRead(ExceptionDisponibiliteBase):
    id: UUID
    actif: bool
    created_at: datetime
    updated_at: datetime


class MedicamentBase(BaseModel):
    nom_commercial: str
    dci: str
    dosage: str
    forme: str
    classe_therapeutique: str


class MedicamentCreate(MedicamentBase):
    pass


class MedicamentRead(MedicamentBase):
    id: UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class TraitementProgression(BaseModel):
    ordonnance_id: UUID
    numero: str
    jours_effectues: int
    jours_restants: int
    duree_totale: int
    pourcentage: float
    statut: str
    couleur: str
    total_prises_prevues: int
    total_prises_effectuees: int
    total_prises_oubliees: int
    prochaine_prise: Optional[PriseMedicamentRead] = None

    model_config = {"from_attributes": True}


class CategorieTicketRead(BaseModel):
    id: UUID
    nom: str
    description: Optional[str] = None
    module: str
    icone: Optional[str] = None
    actif: bool

    model_config = {"from_attributes": True}


class TicketCreate(BaseModel):
    categorie_id: UUID
    sujet: str = Field(min_length=3, max_length=300)
    description: str = Field(min_length=10)
    piece_jointe_url: Optional[str] = None


class TicketUpdate(BaseModel):
    statut: Optional[str] = None
    priorite: Optional[str] = None
    assigne_a: Optional[UUID] = None


class TicketRead(BaseModel):
    id: UUID
    numero: str
    patient_id: UUID
    categorie_id: UUID
    sujet: str
    description: str
    statut: str
    priorite: str
    assigne_a: Optional[UUID] = None
    piece_jointe_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    categorie_nom: Optional[str] = None
    patient_prenom: Optional[str] = None
    patient_nom: Optional[str] = None
    numero_patient: Optional[str] = None
    assigne_prenom: Optional[str] = None
    assigne_nom: Optional[str] = None
    nb_reponses: Optional[int] = 0

    model_config = {"from_attributes": True}


class TicketReponseCreate(BaseModel):
    contenu: str = Field(min_length=1)
    piece_jointe_url: Optional[str] = None


class TicketReponseRead(BaseModel):
    id: UUID
    ticket_id: UUID
    auteur_id: UUID
    contenu: str
    piece_jointe_url: Optional[str] = None
    created_at: datetime
    auteur_prenom: Optional[str] = None
    auteur_nom: Optional[str] = None
    auteur_role: Optional[str] = None

    model_config = {"from_attributes": True}


class MiseAJourBase(BaseModel):
    titre: str
    contenu: str
    lien: Optional[str] = None
    icon: Optional[str] = "🔔"
    est_active: Optional[bool] = True
    est_visible_medecin: Optional[bool] = False


class MiseAJourCreate(MiseAJourBase):
    pass


class MiseAJourUpdate(BaseModel):
    titre: Optional[str] = None
    contenu: Optional[str] = None
    lien: Optional[str] = None
    icon: Optional[str] = None
    est_active: Optional[bool] = None
    est_visible_medecin: Optional[bool] = None


class MiseAJourRead(MiseAJourBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ActualiteBase(BaseModel):
    titre: str
    description: str
    lien: Optional[str] = None
    couleur: Optional[str] = "bg-blue-500"
    icon: Optional[str] = "📢"
    est_active: Optional[bool] = True
    ordre: Optional[int] = 0


class ActualiteCreate(ActualiteBase):
    pass


class ActualiteUpdate(BaseModel):
    titre: Optional[str] = None
    description: Optional[str] = None
    lien: Optional[str] = None
    couleur: Optional[str] = None
    icon: Optional[str] = None
    est_active: Optional[bool] = None
    ordre: Optional[int] = None


class ActualiteRead(ActualiteBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AnalyseBiologiqueRead(BaseModel):
    id: UUID
    nom: str
    categorie: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}

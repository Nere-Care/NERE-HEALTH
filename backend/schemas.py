from datetime import date, datetime, time
from decimal import Decimal
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str
    prenom: str
    nom: str
    telephone: Optional[str] = None


class UserRead(UserBase):
    id: UUID
    role: Optional[str] = None
    prenom: Optional[str] = None
    nom: Optional[str] = None
    telephone: Optional[str] = None
    statut: Optional[str] = None
    full_name: Optional[str] = None
    is_active: bool

    model_config = {"from_attributes": True}


class PatientBase(BaseModel):
    numero_patient: str
    date_naissance: Optional[date] = None
    sexe: Optional[str] = None
    groupe_sanguin: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    region: Optional[str] = None
    pays: Optional[str] = None
    code_postal: Optional[str] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    taille_cm: Optional[Decimal] = None
    poids_kg: Optional[Decimal] = None
    allergies: Optional[List[str]] = None
    antecedents_medicaux: Optional[str] = None
    medicaments_en_cours: Optional[str] = None
    couverture_assurance: Optional[str] = None
    numero_assurance: Optional[str] = None
    organisme_assurance: Optional[str] = None
    contact_urgence_nom: Optional[str] = None
    contact_urgence_tel: Optional[str] = None
    contact_urgence_lien: Optional[str] = None
    consentement_donnees: Optional[bool] = False
    date_consentement: Optional[datetime] = None
    consentement_marketing: Optional[bool] = False


class PatientCreate(PatientBase):
    pass


class PatientRead(PatientBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConsultationBase(BaseModel):
    numero_consultation: str
    rdv_id: UUID
    dossier_id: UUID
    medecin_id: UUID
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
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrdonnanceLigneBase(BaseModel):
    ordre: Optional[int] = 1
    medicament_nom: str
    dci: Optional[str] = None
    classe_therapeutique: Optional[str] = None
    dosage: str
    forme: str
    posologie: str
    frequence_par_jour: Optional[int] = 1
    duree_jours: int
    quantite: int
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
    consultation_id: UUID
    medecin_id: UUID
    patient_id: UUID
    date_emission: Optional[date] = None
    date_expiration: date
    statut: Optional[str] = "active"
    date_utilisation: Optional[datetime] = None
    pharmacie_utilisee: Optional[str] = None
    qr_code_data: str
    qr_code_url: Optional[str] = None
    code_pharmacie: Optional[str] = None
    signature_numerique: Optional[str] = None
    hash_integritet: Optional[str] = None
    pdf_url: Optional[str] = None
    notes_medecin: Optional[str] = None
    renouvelable: Optional[bool] = False
    nb_renouvellements_max: Optional[int] = 0
    nb_renouvellements: Optional[int] = 0
    lignes: Optional[List[OrdonnanceLigneCreate]] = None


class OrdonnanceCreate(OrdonnanceBase):
    pass


class OrdonnanceRead(OrdonnanceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    lignes: Optional[List[OrdonnanceLigneRead]] = None

    model_config = {"from_attributes": True}


class PaiementBase(BaseModel):
    reference: str
    rdv_id: UUID
    patient_id: UUID
    medecin_id: UUID
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
    date_expiration: Optional[datetime] = None


class PaiementCreate(PaiementBase):
    pass


class PaiementRead(PaiementBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


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
    pass


class DossierMedicalRead(DossierMedicalBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RendezVousBase(BaseModel):
    numero_rdv: str
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
    numero_ordre: str
    statut_verification: Optional[str] = "en_attente"
    date_verification: Optional[datetime] = None
    verifie_par_admin_id: Optional[UUID] = None
    annees_experience: Optional[int] = 0
    biographie: Optional[str] = None
    diplomes: Optional[List[Dict[str, object]]] = None
    certifications: Optional[List[Dict[str, object]]] = None
    langues_parlees: Optional[List[str]] = None
    tarif_consultation: Optional[Decimal] = Decimal("5000.00")
    devise: Optional[str] = "XAF"
    teleconsultation_active: Optional[bool] = True
    note_moyenne: Optional[Decimal] = Decimal("0.00")
    nombre_avis: Optional[int] = 0
    nombre_consultations: Optional[int] = 0
    structure_id: Optional[UUID] = None
    disponible_maintenant: Optional[bool] = False


class MedecinCreate(MedecinBase):
    pass


class MedecinRead(MedecinBase):
    created_at: datetime
    updated_at: datetime

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
    capacite_lits: Optional[int] = None


class StructureCreate(StructureBase):
    pass


class StructureRead(StructureBase):
    created_at: datetime
    updated_at: datetime

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

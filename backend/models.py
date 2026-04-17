from datetime import datetime
from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    PrimaryKeyConstraint,
    SmallInteger,
    String,
    Text,
    Time,
    UniqueConstraint,
    BigInteger,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY as PG_ARRAY, BYTEA, ENUM, INET, JSONB, UUID
from sqlalchemy.exc import NoSuchTableError
from sqlalchemy.orm import relationship

from db import Base


def _enum_type(values: tuple[str, ...], name: str):
    return ENUM(*values, name=name, create_type=False)


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="uq_users_email"),
        UniqueConstraint("telephone", name="uq_users_telephone"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email = Column(String(255), nullable=False)
    telephone = Column(String(20))
    mot_de_passe_hash = Column(String(255), nullable=False)
    role = Column(
        _enum_type(("patient", "medecin", "structure", "admin", "observateur"), "role_utilisateur"),
        nullable=False,
    )
    statut = Column(
        _enum_type(("actif", "inactif", "suspendu", "en_attente", "supprime"), "statut_compte"),
        nullable=False,
        server_default=text("'en_attente'::public.statut_compte"),
    )
    nom = Column(String(100))
    prenom = Column(String(100))
    photo_url = Column(String(1000))
    langue = Column(String(5), nullable=False, server_default=text("'fr'"))
    theme = Column(
        _enum_type(("clair", "sombre", "auto"), "theme_interface"),
        nullable=False,
        server_default=text("'clair'::public.theme_interface"),
    )
    totp_secret = Column(String(100))
    totp_actif = Column(Boolean, nullable=False, server_default=text("false"))
    email_verifie = Column(Boolean, nullable=False, server_default=text("false"))
    email_otp = Column(String(6))
    email_otp_expires = Column(DateTime(timezone=True))
    telephone_verifie = Column(Boolean, nullable=False, server_default=text("false"))
    reset_password_token = Column(String(255))
    reset_password_token_expires = Column(DateTime(timezone=True))
    last_login = Column(DateTime(timezone=True))
    nb_tentatives_connexion = Column(Integer, nullable=False, server_default=text("0"))
    bloque_jusqu_a = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    deleted_at = Column(DateTime(timezone=True))

    @property
    def hashed_password(self):
        return self.mot_de_passe_hash

    @property
    def is_active(self):
        return self.statut == "actif"

    @property
    def full_name(self):
        lastname = self.nom or ""
        firstname = self.prenom or ""
        return f"{firstname} {lastname}".strip()


class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = (UniqueConstraint("numero_patient", name="uq_patients_numero_patient"),)

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True, server_default=text("gen_random_uuid()"))
    numero_patient = Column(String(25), nullable=False)
    date_naissance = Column(Date)
    sexe = Column(
        _enum_type(("M", "F", "Autre", "Non_precise"), "sexe_enum"),
        nullable=False,
        server_default=text("'Non_precise'::public.sexe_enum"),
    )
    groupe_sanguin = Column(
        _enum_type(("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Inconnu"), "groupe_sanguin_enum"),
        nullable=False,
        server_default=text("'Inconnu'::public.groupe_sanguin_enum"),
    )
    adresse = Column(Text)
    ville = Column(String(100))
    region = Column(String(100))
    pays = Column(String(50), nullable=False, server_default=text("'CM'"))
    code_postal = Column(String(10))
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    taille_cm = Column(Numeric(5, 2))
    poids_kg = Column(Numeric(5, 2))
    allergies = Column(ARRAY(Text))
    antecedents_medicaux = Column(Text)
    medicaments_en_cours = Column(Text)
    couverture_assurance = Column(String(200))
    numero_assurance = Column(String(100))
    organisme_assurance = Column(String(200))
    contact_urgence_nom = Column(String(150))
    contact_urgence_tel = Column(String(20))
    contact_urgence_lien = Column(String(50))
    consentement_donnees = Column(Boolean, nullable=False, server_default=text("false"))
    date_consentement = Column(DateTime(timezone=True))
    consentement_marketing = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Consultation(Base):
    __tablename__ = "consultations"
    __table_args__ = (
        UniqueConstraint("numero_consultation", name="uq_consultations_numero_consultation"),
        UniqueConstraint("rdv_id", name="uq_consultations_rdv_id"),
        Index("ix_consultations_patient_id", "patient_id"),
        Index("ix_consultations_medecin_id", "medecin_id"),
        Index("ix_consultations_rdv_id", "rdv_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    numero_consultation = Column(String(30), nullable=False)
    rdv_id = Column(UUID(as_uuid=True), ForeignKey("rendez_vous.id"), nullable=False)
    dossier_id = Column(UUID(as_uuid=True), nullable=False)
    medecin_id = Column(UUID(as_uuid=True), ForeignKey("medecins.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    date_heure_debut = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    date_heure_fin = Column(DateTime(timezone=True))
    duree_minutes = Column(Integer)
    motif = Column(Text, nullable=False)
    anamnese = Column(Text)
    examen_clinique = Column(Text)
    diagnostic_principal = Column(Text)
    code_cim10 = Column(String(10))
    diagnostics_secondaires = Column(ARRAY(Text))
    plan_traitement = Column(Text)
    observations = Column(Text)
    suivi_necessaire = Column(Boolean, nullable=False, server_default=text("false"))
    date_prochain_rdv = Column(Date)
    instructions_patient = Column(Text)
    transcription_ia = Column(Text)
    resume_ia = Column(Text)
    statut = Column(String(20), nullable=False, server_default=text("'en_cours'"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Ordonnance(Base):
    __tablename__ = "ordonnances"
    __table_args__ = (
        UniqueConstraint("numero", name="uq_ordonnances_numero"),
        UniqueConstraint("code_pharmacie", name="uq_ordonnances_code_pharmacie"),
        Index("ix_ordonnances_consultation_id", "consultation_id"),
        Index("ix_ordonnances_patient_id", "patient_id"),
        Index("ix_ordonnances_medecin_id", "medecin_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    numero = Column(String(30), nullable=False)
    consultation_id = Column(UUID(as_uuid=True), ForeignKey("consultations.id"), nullable=False)
    medecin_id = Column(UUID(as_uuid=True), ForeignKey("medecins.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    date_emission = Column(Date, nullable=False, server_default=func.current_date())
    date_expiration = Column(Date, nullable=False)
    statut = Column(
        _enum_type(("active", "utilisee", "partiellement_utilisee", "expiree", "annulee"), "statut_ordonnance"),
        nullable=False,
        server_default=text("'active'::public.statut_ordonnance"),
    )
    date_utilisation = Column(DateTime(timezone=True))
    pharmacie_utilisee = Column(String(200))
    qr_code_data = Column(Text, nullable=False)
    qr_code_url = Column(String(1000))
    code_pharmacie = Column(String(20))
    signature_numerique = Column(Text)
    hash_integritet = Column(String(64))
    pdf_url = Column(String(1000))
    notes_medecin = Column(Text)
    renouvelable = Column(Boolean, nullable=False, server_default=text("false"))
    nb_renouvellements_max = Column(Integer, nullable=False, server_default=text("0"))
    nb_renouvellements = Column(Integer, nullable=False, server_default=text("0"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    lignes = relationship("OrdonnanceLigne", back_populates="ordonnance", cascade="all, delete-orphan", lazy="selectin")


class OrdonnanceLigne(Base):
    __tablename__ = "ordonnance_lignes"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    ordonnance_id = Column(UUID(as_uuid=True), ForeignKey("ordonnances.id"), nullable=False)
    ordre = Column(SmallInteger, nullable=False, server_default=text("1"))
    medicament_nom = Column(String(300), nullable=False)
    dci = Column(String(300))
    classe_therapeutique = Column(String(150))
    dosage = Column(String(100), nullable=False)
    forme = Column(
        _enum_type(
            (
                "comprimes",
                "gelules",
                "sirop",
                "injectable",
                "creme",
                "pommade",
                "gouttes",
                "suppositoire",
                "patch",
                "inhalateur",
                "autre",
            ),
            "forme_medicament",
        ),
        nullable=False,
    )
    posologie = Column(String(500), nullable=False)
    frequence_par_jour = Column(SmallInteger, nullable=False, server_default=text("1"))
    duree_jours = Column(Integer, nullable=False)
    quantite = Column(Integer, nullable=False)
    avant_repas = Column(Boolean)
    heure_prise = Column(ARRAY(Time))
    instructions_speciales = Column(Text)
    interactions_a_eviter = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    ordonnance = relationship("Ordonnance", back_populates="lignes")


class Paiement(Base):
    __tablename__ = "paiements"
    __table_args__ = (
        UniqueConstraint("reference", name="uq_paiements_reference"),
        Index("ix_paiements_rdv_id", "rdv_id"),
        Index("ix_paiements_patient_id", "patient_id"),
        Index("ix_paiements_medecin_id", "medecin_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    reference = Column(String(50), nullable=False)
    rdv_id = Column(UUID(as_uuid=True), ForeignKey("rendez_vous.id"), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    medecin_id = Column(UUID(as_uuid=True), ForeignKey("medecins.id"), nullable=False)
    montant_total = Column(Numeric(10, 2), nullable=False)
    devise = Column(
        _enum_type(("XAF", "EUR", "USD", "GBP", "XOF"), "devise_enum"),
        nullable=False,
        server_default=text("'XAF'::public.devise_enum"),
    )
    frais_plateforme = Column(Numeric(10, 2), nullable=False, server_default=text("0"))
    taux_commission = Column(Numeric(5, 4), nullable=False, server_default=text("0.1000"))
    montant_medecin = Column(Numeric(10, 2))
    methode = Column(
        _enum_type(
            (
                "mtn_momo",
                "orange_money",
                "carte_visa",
                "carte_mastercard",
                "virement_bancaire",
                "notchpay",
                "stripe",
                "portefeuille_nere",
            ),
            "methode_paiement",
        ),
        nullable=False,
    )
    fournisseur = Column(
        _enum_type(("cinetpay", "stripe", "notchpay", "interne"), "fournisseur_paiement"),
        nullable=False,
    )
    statut = Column(
        _enum_type(
            (
                "initie",
                "en_attente_confirmation",
                "confirme",
                "echoue",
                "rembourse",
                "rembourse_partiel",
                "annule",
                "expire",
            ),
            "statut_paiement",
        ),
        nullable=False,
        server_default=text("'initie'::public.statut_paiement"),
    )
    reference_fournisseur = Column(String(200))
    transaction_id_externe = Column(String(200))
    url_paiement = Column(String(2000))
    date_remboursement = Column(DateTime(timezone=True))
    motif_remboursement = Column(Text)
    montant_rembourse = Column(Numeric(10, 2))
    reference_remboursement = Column(String(200))
    webhook_data = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    webhook_signature = Column(String(500))
    reversi_effectue = Column(Boolean, nullable=False, server_default=text("false"))
    date_reversement = Column(DateTime(timezone=True))
    reference_reversement = Column(String(200))
    ip_paiement = Column(INET)
    user_agent_paiement = Column(Text)
    date_expiration = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class DossierMedical(Base):
    __tablename__ = "dossiers_medicaux"
    __table_args__ = (
        UniqueConstraint("numero_dossier", name="uq_dossiers_medicaux_numero_dossier"),
        UniqueConstraint("patient_id", name="uq_dossiers_medicaux_patient_id"),
        UniqueConstraint("code_partage", name="uq_dossiers_medicaux_code_partage"),
        Index("ix_dossiers_medicaux_medecin_traitant_id", "medecin_traitant_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    numero_dossier = Column(String(30), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    medecin_traitant_id = Column(UUID(as_uuid=True), ForeignKey("medecins.id"))
    antecedents_familiaux = Column(Text)
    antecedents_personnels = Column(Text)
    antecedents_chirurgicaux = Column(Text)
    antecedents_allergiques = Column(Text)
    antecedents_gyneco = Column(Text)
    habitudes_vie = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    taille_cm = Column(Numeric(5, 2))
    poids_kg = Column(Numeric(5, 2))
    imc = Column(Numeric(4, 2))
    tension_arterielle = Column(String(20))
    glycemie_a_jeun = Column(Numeric(6, 2))
    vaccinations = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    traitements_chroniques = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    code_partage = Column(String(20))
    code_partage_expires = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class RendezVous(Base):
    __tablename__ = "rendez_vous"
    __table_args__ = (
        UniqueConstraint("numero_rdv", name="uq_rendez_vous_numero_rdv"),
        Index("ix_rendez_vous_patient_id", "patient_id"),
        Index("ix_rendez_vous_medecin_id", "medecin_id"),
        Index("ix_rendez_vous_structure_id", "structure_id"),
        Index("ix_rendez_vous_date_heure_debut", "date_heure_debut"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    numero_rdv = Column(String(30), nullable=False)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    medecin_id = Column(UUID(as_uuid=True), ForeignKey("medecins.id"), nullable=False)
    structure_id = Column(UUID(as_uuid=True), ForeignKey("structures.id"))
    date_heure_debut = Column(DateTime(timezone=True), nullable=False)
    date_heure_fin = Column(DateTime(timezone=True), nullable=False)
    type = Column(
        _enum_type(("presentiel", "video", "audio", "chat"), "type_consultation"),
        nullable=False,
    )
    statut = Column(
        _enum_type(
            (
                "en_attente",
                "confirme",
                "annule_patient",
                "annule_medecin",
                "annule_systeme",
                "en_cours",
                "termine",
                "no_show_patient",
                "no_show_medecin",
                "rembourse",
            ),
            "statut_rdv",
        ),
        nullable=False,
        server_default=text("'en_attente'::public.statut_rdv"),
    )
    motif_consultation = Column(Text)
    symptomes_declares = Column(ARRAY(Text))
    notes_patient = Column(Text)
    notes_pre_consultation = Column(Text)
    lien_video = Column(String(1000))
    webrtc_room_id = Column(String(100))
    token_patient = Column(String(500))
    token_medecin = Column(String(500))
    montant = Column(Numeric(10, 2), nullable=False, server_default=text("0"))
    devise = Column(
        _enum_type(("XAF", "EUR", "USD", "GBP", "XOF"), "devise_enum"),
        nullable=False,
        server_default=text("'XAF'::public.devise_enum"),
    )
    annule_par = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    motif_annulation = Column(Text)
    date_annulation = Column(DateTime(timezone=True))
    rappel_j1_envoye = Column(Boolean, nullable=False, server_default=text("false"))
    rappel_h1_envoye = Column(Boolean, nullable=False, server_default=text("false"))
    note_patient = Column(SmallInteger)
    commentaire_patient = Column(Text)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_utilisateur_id", "utilisateur_id"),
        Index("ix_notifications_statut", "statut"),
    )
    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    utilisateur_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type = Column(
        _enum_type(
            (
                "rappel_rdv",
                "confirmation_rdv",
                "annulation_rdv",
                "confirmation_paiement",
                "echec_paiement",
                "remboursement",
                "nouveau_message",
                "resultat_labo_disponible",
                "ordonnance_prete",
                "alerte_systeme",
                "compte_valide",
                "compte_rejete",
                "nouveaux_avis",
            ),
            "type_notification",
        ),
        nullable=False,
    )
    canal = Column(
        _enum_type(("push", "sms", "email", "in_app", "whatsapp"), "canal_notification"),
        nullable=False,
        server_default=text("'in_app'::public.canal_notification"),
    )
    statut = Column(
        _enum_type(("en_attente", "envoye", "lu", "echoue", "expire"), "statut_notification"),
        nullable=False,
        server_default=text("'en_attente'::public.statut_notification"),
    )
    titre = Column(String(300), nullable=False)
    contenu = Column(Text, nullable=False)
    donnees_supplementaires = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    date_envoi_planifie = Column(DateTime(timezone=True), server_default=func.now())
    date_envoi_reel = Column(DateTime(timezone=True))
    date_lecture = Column(DateTime(timezone=True))
    nb_tentatives = Column(SmallInteger, nullable=False, server_default=text("0"))
    derniere_erreur = Column(Text)
    prochaine_tentative = Column(DateTime(timezone=True))
    reference_externe = Column(String(500))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Avis(Base):
    __tablename__ = "avis"
    __table_args__ = (
        Index("ix_avis_patient_id", "patient_id"),
        Index("ix_avis_medecin_id", "medecin_id"),
        Index("ix_avis_rdv_id", "rdv_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    medecin_id = Column(UUID(as_uuid=True), ForeignKey("medecins.id"), nullable=False)
    rdv_id = Column(UUID(as_uuid=True), ForeignKey("rendez_vous.id"), nullable=False)
    note = Column(SmallInteger, nullable=False)
    commentaire = Column(Text)
    verifie = Column(Boolean, nullable=False, server_default=text("false"))
    verifie_par = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    masque = Column(Boolean, nullable=False, server_default=text("false"))
    motif_masquage = Column(Text)
    reponse_medecin = Column(Text)
    date_reponse = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class ChatbotSession(Base):
    __tablename__ = "chatbot_sessions"
    __table_args__ = (
        Index("ix_chatbot_sessions_patient_id", "patient_id"),
        Index("ix_chatbot_sessions_medecin_id", "medecin_id"),
        Index("ix_chatbot_sessions_rdv_cree_id", "rdv_cree_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    medecin_id = Column(UUID(as_uuid=True), ForeignKey("medecins.id"), nullable=True)
    messages = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    symptomes_detectes = Column(ARRAY(String), nullable=False, server_default=text("ARRAY[]::text[]"))
    specialite_suggeree = Column(String(100))
    niveau_urgence = Column(
        _enum_type(("faible", "modere", "eleve", "urgence_vitale"), "niveau_urgence"),
        nullable=False,
        server_default=text("'faible'::public.niveau_urgence"),
    )
    redirection_rdv = Column(Boolean, nullable=False, server_default=text("false"))
    rdv_cree_id = Column(UUID(as_uuid=True), ForeignKey("rendez_vous.id"))
    modele_ia = Column(String(50), nullable=False, server_default=text("'gpt-4o-mini'"))
    tokens_utilises = Column(Integer, nullable=False, server_default=text("0"))
    cout_estime_usd = Column(Numeric(10, 6), nullable=False, server_default=text("0"))
    statut = Column(String(20), nullable=False, server_default=text("'active'"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Conversation(Base):
    __tablename__ = "conversations"
    __table_args__ = (
        Index("ix_conversations_patient_id", "patient_id"),
        Index("ix_conversations_medecin_id", "medecin_id"),
        Index("ix_conversations_rdv_id", "rdv_id"),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    medecin_id = Column(UUID(as_uuid=True), ForeignKey("medecins.id"), nullable=False)
    rdv_id = Column(UUID(as_uuid=True), ForeignKey("rendez_vous.id"))
    statut = Column(String(20), nullable=False, server_default=text("'active'"))
    nb_messages_non_lus_patient = Column(Integer, nullable=False, server_default=text("0"))
    nb_messages_non_lus_medecin = Column(Integer, nullable=False, server_default=text("0"))
    dernier_message_at = Column(DateTime(timezone=True))
    dernier_message_preview = Column(String(200))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Disponibilite(Base):
    __tablename__ = "disponibilites"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    medecin_id = Column(UUID(as_uuid=True), ForeignKey("medecins.id"), nullable=False)
    jour_semaine = Column(
        _enum_type(
            ("lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"),
            "jour_semaine",
        ),
        nullable=False,
    )
    heure_debut = Column(Time, nullable=False)
    heure_fin = Column(Time, nullable=False)
    duree_creneau_minutes = Column(Integer, nullable=False, server_default=text("30"))
    type = Column(
        _enum_type(("presentiel", "video", "audio", "chat"), "type_consultation"),
        nullable=False,
        server_default=text("'video'::public.type_consultation"),
    )
    recurrence = Column(
        _enum_type(("unique", "quotidien", "hebdomadaire", "bi_mensuel", "mensuel"), "recurrence_enum"),
        nullable=False,
        server_default=text("'hebdomadaire'::public.recurrence_enum"),
    )
    date_debut_validite = Column(Date, nullable=False, server_default=func.current_date())
    date_fin_validite = Column(Date)
    exceptions = Column(ARRAY(Date), nullable=False, server_default=text("ARRAY[]::date[]"))
    actif = Column(Boolean, nullable=False, server_default=text("true"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class DocumentMedical(Base):
    __tablename__ = "documents_medicaux"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    consultation_id = Column(UUID(as_uuid=True), ForeignKey("consultations.id"))
    medecin_uploadeur_id = Column(UUID(as_uuid=True), ForeignKey("medecins.id"))
    uploaded_par = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type_document = Column(
        _enum_type(
            (
                "resultat_labo",
                "imagerie_radio",
                "imagerie_echographie",
                "imagerie_scanner",
                "imagerie_irm",
                "compte_rendu_consultation",
                "ordonnance_scannee",
                "certificat_medical",
                "carnet_vaccination",
            ),
            "type_document_medical",
        ),
        nullable=False,
    )
    nom_fichier_original = Column(String(500), nullable=False)
    nom_fichier_stockage = Column(String(500), nullable=False)
    url_stockage = Column(String(2000), nullable=False)
    checksum_sha256 = Column(String(64), nullable=False)
    taille_octets = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=False)
    est_chiffre = Column(Boolean, nullable=False, server_default=text("true"))
    cle_chiffrement_ref = Column(String(100))
    partage_avec_medecins = Column(ARRAY(UUID(as_uuid=True)), nullable=False, server_default=text("ARRAY[]::uuid[]"))
    visible_patient = Column(Boolean, nullable=False, server_default=text("true"))
    description = Column(Text)
    date_document = Column(Date)
    laboratoire_nom = Column(String(200))
    prescripteur_nom = Column(String(200))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class MedecinSpecialite(Base):
    __tablename__ = "medecin_specialites"
    __table_args__ = (
        PrimaryKeyConstraint("medecin_id", "specialite_id", name="pk_medecin_specialites"),
        CheckConstraint("annees_pratique >= 0", name="medecin_specialites_annees_pratique_check"),
    )

    medecin_id = Column(UUID(as_uuid=True), ForeignKey("medecins.id"), nullable=False)
    specialite_id = Column(UUID(as_uuid=True), ForeignKey("specialites.id"), nullable=False)
    principale = Column(Boolean, nullable=False, server_default=text("false"))
    annees_pratique = Column(Integer, nullable=False, server_default=text("0"))
    certifie = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Medecin(Base):
    __tablename__ = "medecins"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    numero_ordre = Column(String(60), nullable=False)
    statut_verification = Column(
        _enum_type(
            ("en_attente", "en_cours_verification", "verifie", "rejete", "suspendu"),
            "statut_verification",
        ),
        nullable=False,
        server_default=text("'en_attente'::public.statut_verification"),
    )
    date_verification = Column(DateTime(timezone=True))
    verifie_par_admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    annees_experience = Column(Integer, nullable=False, server_default=text("0"))
    biographie = Column(Text)
    diplomes = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    certifications = Column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    langues_parlees = Column(ARRAY(String(10)), nullable=False, server_default=text("ARRAY['fr'::text]"))
    tarif_consultation = Column(Numeric(10, 2), nullable=False, server_default=text("5000.00"))
    devise = Column(
        _enum_type(("XAF", "EUR", "USD", "GBP", "XOF"), "devise_enum"),
        nullable=False,
        server_default=text("'XAF'::public.devise_enum"),
    )
    teleconsultation_active = Column(Boolean, nullable=False, server_default=text("true"))
    note_moyenne = Column(Numeric(3, 2), nullable=False, server_default=text("0.00"))
    nombre_avis = Column(Integer, nullable=False, server_default=text("0"))
    nombre_consultations = Column(Integer, nullable=False, server_default=text("0"))
    structure_id = Column(UUID(as_uuid=True), ForeignKey("structures.id"))
    disponible_maintenant = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), nullable=False)
    expediteur_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    contenu_chiffre = Column(BYTEA, nullable=False)
    type = Column(
        _enum_type(("texte", "image", "document", "audio", "video", "systeme"), "type_message"),
        nullable=False,
        server_default=text("'texte'::public.type_message"),
    )
    fichier_url = Column(String(2000))
    fichier_nom = Column(String(500))
    fichier_taille = Column(BigInteger)
    fichier_mime = Column(String(100))
    lu_par_destinataire = Column(Boolean, nullable=False, server_default=text("false"))
    date_lecture = Column(DateTime(timezone=True))
    signale = Column(Boolean, nullable=False, server_default=text("false"))
    supprime_par_expediteur = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    utilisateur_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    refresh_token_hash = Column(String(255), nullable=False)
    access_token_jti = Column(String(100))
    ip_address = Column(INET, nullable=False)
    user_agent = Column(Text)
    appareil = Column(String(200))
    localisation = Column(String(200))
    plateforme = Column(String(20))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoque = Column(Boolean, nullable=False, server_default=text("false"))
    date_revocation = Column(DateTime(timezone=True))
    motif_revocation = Column(String(50))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_used_at = Column(DateTime(timezone=True), server_default=func.now())


class Specialite(Base):
    __tablename__ = "specialites"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    code = Column(String(30), nullable=False)
    libelle_fr = Column(String(150), nullable=False)
    libelle_en = Column(String(150))
    description = Column(Text)
    icone_url = Column(String(1000))
    actif = Column(Boolean, nullable=False, server_default=text("true"))
    ordre_affichage = Column(Integer, nullable=False, server_default=text("0"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Structure(Base):
    __tablename__ = "structures"

    id = Column(UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True)
    nom_etablissement = Column(String(300), nullable=False)
    type = Column(String(50), nullable=False)
    statut_verification = Column(
        _enum_type(
            ("en_attente", "en_cours_verification", "verifie", "rejete", "suspendu"),
            "statut_verification",
        ),
        nullable=False,
        server_default=text("'en_attente'::public.statut_verification"),
    )
    numero_autorisation = Column(String(100))
    numero_contribuable = Column(String(50))
    date_creation = Column(Date)
    adresse = Column(Text, nullable=False)
    ville = Column(String(100), nullable=False)
    region = Column(String(100))
    pays = Column(String(50), nullable=False, server_default=text("'CM'"))
    latitude = Column(Numeric(10, 8))
    longitude = Column(Numeric(11, 8))
    telephone_pro = Column(String(20))
    email_pro = Column(String(255))
    site_web = Column(String(1000))
    description = Column(Text)
    logo_url = Column(String(1000))
    horaires_ouverture = Column(JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    services_offerts = Column(ARRAY(String), nullable=False, server_default=text("ARRAY[]::text[]"))
    capacite_lits = Column(Integer)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    utilisateur_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    role_utilisateur = Column(
        _enum_type(("patient", "medecin", "structure", "admin", "observateur"), "role_utilisateur")
    )
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"))
    action = Column(
        _enum_type(
            (
                "creation",
                "lecture",
                "modification",
                "suppression",
                "connexion",
                "deconnexion",
                "tentative_connexion_echec",
                "paiement_initie",
                "paiement_confirme",
                "paiement_echoue",
                "remboursement",
                "export_donnees",
                "acces_dossier_medical",
                "acces_ordonnance",
                "validation_compte",
                "suspension_compte",
                "revocation_session",
                "upload_document",
                "teleconsultation_debut",
                "teleconsultation_fin",
            ),
            "action_audit",
        ),
        nullable=False,
    )
    entite_type = Column(String(100))
    entite_id = Column(UUID(as_uuid=True))
    ip_address = Column(INET)
    user_agent = Column(Text)
    endpoint = Column(String(500))
    methode_http = Column(String(10))
    donnees_avant = Column(JSONB)
    donnees_apres = Column(JSONB)
    succes = Column(Boolean, nullable=False, server_default=text("true"))
    code_http = Column(SmallInteger)
    message_erreur = Column(Text)
    duree_ms = Column(Integer)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())


def get_model(table_name: str):
    for mapper in Base.registry.mappers:
        if mapper.local_table.name == table_name:
            return mapper.class_
    raise NoSuchTableError(f"Table '{table_name}' not found")


def prepare_models():
    return Base

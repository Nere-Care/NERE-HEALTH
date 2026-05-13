import time
import warnings

import pytest
from fastapi.testclient import TestClient

# Suppress HTTPX verify parameter deprecation warning (will be fixed in future httpx version)
warnings.filterwarnings(
    "ignore",
    category=DeprecationWarning,
    message=".*verify=<str> is deprecated.*",
)

from backend.main import app

client = TestClient(app)


@pytest.fixture
def test_patient(db):
    """Crée un patient de test pour les tests de paiement"""
    from backend.auth import get_password_hash
    from backend.models import Patient, User

    patient_email = "patient_test@example.com"
    patient = db.query(User).filter(User.email == patient_email).first()
    if not patient:
        patient = User(
            email=patient_email,
            prenom="Patient",
            nom="Test",
            mot_de_passe_hash=get_password_hash("Patient123!"),
            role="patient",
            statut="actif",
        )
        db.add(patient)
        db.commit()
        db.refresh(patient)

    patient_profile = db.get(Patient, patient.id)
    if not patient_profile:
        patient_profile = Patient(
            id=patient.id,
            numero_patient="PATIENT_TEST_001",
        )
        db.add(patient_profile)
        db.commit()

    return patient


@pytest.fixture
def test_medecin(db):
    """Crée un médecin de test pour les tests de paiement"""
    from backend.auth import get_password_hash
    from backend.models import Medecin, User

    medecin_email = "medecin_test@example.com"
    medecin = db.query(User).filter(User.email == medecin_email).first()
    if not medecin:
        medecin = User(
            email=medecin_email,
            prenom="Médecin",
            nom="Test",
            mot_de_passe_hash=get_password_hash("Medecin123!"),
            role="medecin",
            statut="actif",
        )
        db.add(medecin)
        db.commit()
        db.refresh(medecin)

    medecin_profile = db.get(Medecin, medecin.id)
    if not medecin_profile:
        medecin_profile = Medecin(
            id=medecin.id,
            numero_ordre="MED_TEST_001",
        )
        db.add(medecin_profile)
        db.commit()

    return medecin


@pytest.fixture
def test_medecin_auth_header(db, test_medecin):
    """Crée un header d'authentification pour le médecin de test"""
    from backend.jwt_handler import JWTHandler

    # Créer un token pour le médecin de test
    access_token = JWTHandler.create_access_token(
        user_id=test_medecin.id, email=test_medecin.email, role=test_medecin.role
    )
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture
def test_rdv(db, test_patient, test_medecin):
    """Crée un RDV de test pour les tests de paiement"""
    import uuid
    from datetime import datetime, timedelta, timezone

    from backend.models import RendezVous

    now = datetime.now(timezone.utc)
    rdv = RendezVous(
        numero_rdv=f"RDV_TEST_{uuid.uuid4().hex[:8]}",
        patient_id=test_patient.id,
        medecin_id=test_medecin.id,
        date_heure_debut=now,
        date_heure_fin=now + timedelta(hours=1),
        type="presentiel",
        motif_consultation="Consultation de test",
        statut="en_attente",
        montant=100.0,
        devise="EUR",
    )
    db.add(rdv)
    db.commit()
    db.refresh(rdv)
    return rdv


class TestPaiementRateLimiting:
    """Tests pour vérifier le rate limiting sur les routes de paiement"""

    def test_create_paiement_rate_limit(
        self, test_medecin_auth_header, test_patient, test_medecin, test_rdv
    ):
        """Test que la création de paiement est limitée à 10/minute"""
        import uuid

        # Faire 11 requêtes rapidement
        responses = []
        for i in range(11):
            response = client.post(
                "/api/paiements",
                json={
                    "reference": f"TEST_REF_{i}_{uuid.uuid4().hex[:8]}",  # Référence unique
                    "rdv_id": str(test_rdv.id),  # Utiliser le RDV de test créé
                    "patient_id": str(
                        test_patient.id
                    ),  # Utiliser l'ID réel du patient de test
                    "medecin_id": str(
                        test_medecin.id
                    ),  # Utiliser l'ID réel du médecin de test
                    "montant_total": 100.0,
                    "devise": "EUR",
                    "methode": "carte_visa",
                    "fournisseur": "stripe",
                },
                headers=test_medecin_auth_header,
            )
            responses.append(response)

        # Les 10 premières devraient réussir ou échouer pour d'autres raisons (400, 404, 403, 500)
        # La 11ème devrait être bloquée par rate limiting (429)
        success_count = sum(
            1 for r in responses[:10] if r.status_code in [201, 400, 404, 403, 500]
        )
        rate_limited_count = sum(1 for r in responses[10:] if r.status_code == 429)

        assert success_count >= 8, f"Trop d'échecs inattendus: {success_count}/10"
        assert (
            rate_limited_count >= 1
        ), f"Rate limiting non appliqué: {rate_limited_count}/1"

    def test_checkout_session_rate_limit(
        self, test_medecin_auth_header, test_patient, test_medecin, test_rdv
    ):
        """Test que le checkout est limité à 3/minute"""
        # Faire 4 requêtes rapidement
        responses = []
        for i in range(4):
            response = client.post(
                "/api/paiements/checkout",
                json={
                    "patient_id": str(test_patient.id),
                    "medecin_id": str(test_medecin.id),
                    "rdv_id": str(test_rdv.id),
                    "montant_total": 100.0,
                    "devise": "EUR",
                    "methode": "carte_visa",
                    "fournisseur": "stripe",
                    "description": "Consultation médicale",
                },
                headers=test_medecin_auth_header,
            )
            responses.append(response)

        # Les 3 premières devraient réussir ou échouer pour d'autres raisons (tout sauf 429)
        # La 4ème devrait être bloquée par rate limiting (429)
        success_count = sum(1 for r in responses[:3] if r.status_code != 429)
        rate_limited_count = sum(1 for r in responses[3:] if r.status_code == 429)

        assert success_count >= 2, f"Trop d'échecs inattendus: {success_count}/3"
        assert (
            rate_limited_count >= 1
        ), f"Rate limiting non appliqué: {rate_limited_count}/1"

    def test_read_paiement_rate_limit(self, test_medecin_auth_header, monkeypatch):
        """Test que la lecture de paiement est limitée à 30/minute"""
        from limits.storage import MemoryStorage

        # Utiliser un nouveau stockage pour les tests
        fresh_storage = MemoryStorage()
        monkeypatch.setattr("backend.limiter.payment_limiter._storage", fresh_storage)
        # Patcher la clé pour retourner une clé fixe (TestClient peut avoir des IPs variables)
        monkeypatch.setattr(
            "backend.limiter.payment_limiter._key_func", lambda req: "test-client"
        )

        # Faire 31 requêtes rapidement
        responses = []
        for i in range(31):
            response = client.get(
                "/api/paiements/550e8400-e29b-41d4-a716-446655440000",
                headers=test_medecin_auth_header,
            )
            responses.append(response)

        # Les 30 premières devraient réussir ou échouer pour d'autres raisons
        # La 31ème devrait être bloquée
        success_count = sum(
            1 for r in responses[:30] if r.status_code in [200, 404, 403]
        )
        rate_limited_count = sum(1 for r in responses[30:] if r.status_code == 429)

        assert success_count >= 25, f"Trop d'échecs inattendus: {success_count}/30"
        assert (
            rate_limited_count >= 1
        ), f"Rate limiting non appliqué: {rate_limited_count}/1"

    def test_rate_limit_reset_after_time(self, medecin_auth_header):
        """Test que les limites se réinitialisent après la période"""
        # Faire 4 requêtes checkout (limite 3/minute)
        for i in range(4):
            response = client.post(
                "/api/paiements/checkout",
                json={
                    "patient_id": "550e8400-e29b-41d4-a716-446655440000",
                    "medecin_id": "550e8400-e29b-41d4-a716-446655440001",
                    "rdv_id": "550e8400-e29b-41d4-a716-446655440002",
                    "montant_total": 100.0,
                    "devise": "EUR",
                    "methode": "carte_visa",
                    "fournisseur": "stripe",
                    "description": "Consultation médicale",
                },
                headers=medecin_auth_header,
            )

        # Attendre un peu plus d'une minute pour reset
        time.sleep(65)

        # Cette requête devrait réussir maintenant
        response = client.post(
            "/api/paiements/checkout",
            json={
                "patient_id": "550e8400-e29b-41d4-a716-446655440000",
                "medecin_id": "550e8400-e29b-41d4-a716-446655440001",
                "rdv_id": "550e8400-e29b-41d4-a716-446655440002",
                "montant_total": 100.0,
                "devise": "EUR",
                "methode": "carte_visa",
                "fournisseur": "stripe",
                "description": "Consultation médicale",
            },
            headers=medecin_auth_header,
        )

        # Devrait réussir ou échouer pour d'autres raisons (pas rate limited)
        assert response.status_code != 429, "Rate limiting ne s'est pas réinitialisé"

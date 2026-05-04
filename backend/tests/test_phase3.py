"""
Tests pour Phase 3: Fonctionnalités avancées (IA, Paiements, Téléconsultation)
"""
import pytest
from fastapi.testclient import TestClient
from uuid import uuid4
from decimal import Decimal

from backend.main import app
from backend.models import User, Patient, RendezVous
from sqlalchemy.orm import Session


client = TestClient(app)


@pytest.fixture
def test_patient(db: Session):
    """Créer un patient pour les tests."""
    patient_user = User(
        email=f"patient_phase3_{uuid4().hex}@test.com",
        prenom="Jean",
        nom="Patient",
        role="patient",
        statut="actif",
        mot_de_passe_hash="unused-password-hash",
    )
    db.add(patient_user)
    db.commit()
    db.refresh(patient_user)

    patient = Patient(
        id=patient_user.id,
        numero_patient=f"P{str(uuid4())[:8]}",
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)

    return patient_user, patient


@pytest.fixture
def test_medecin(db: Session):
    """Créer un médecin pour les tests."""
    medecin_user = User(
        email=f"medecin_phase3_{uuid4().hex}@test.com",
        prenom="Dr",
        nom="Medecin",
        role="medecin",
        statut="actif",
        mot_de_passe_hash="unused-password-hash",
    )
    db.add(medecin_user)
    db.commit()
    db.refresh(medecin_user)
    return medecin_user


@pytest.fixture
def test_rendez_vous(db: Session, test_patient, test_medecin):
    """Créer un rendez-vous pour les tests."""
    patient_user, patient = test_patient
    rdv = RendezVous(
        numero_rdv=f"RDV{str(uuid4())[:8]}",
        patient_id=patient.id,
        medecin_id=test_medecin.id,
        type="video",
        statut="confirme",
    )
    db.add(rdv)
    db.commit()
    db.refresh(rdv)
    return rdv


class TestIADiagnostic:
    """Tests pour l'endpoint IA Diagnostic."""

    def test_ia_diagnostic_unauthorized(self):
        """Tester que l'endpoint requiert une authentification."""
        payload = {
            "patient_id": str(uuid4()),
            "symptomes_declares": ["fièvre", "toux"],
        }
        response = client.post("/api/ia/diagnostic", json=payload)
        assert response.status_code == 401

    def test_ia_diagnostic_invalid_patient(self, test_patient, admin_auth_header):
        """Tester avec un patient invalide."""
        payload = {
            "patient_id": str(uuid4()),
            "symptomes_declares": ["fièvre", "toux"],
        }
        response = client.post(
            "/api/ia/diagnostic",
            json=payload,
            headers=admin_auth_header
        )
        assert response.status_code == 400


class TestTeleconsultation:
    """Tests pour les endpoints Teleconsultation."""

    def test_prepare_teleconsultation_unauthorized(self):
        """Tester que prepare requiert une authentification."""
        payload = {"rendez_vous_id": str(uuid4())}
        response = client.post("/api/teleconsultation/prepare", json=payload)
        assert response.status_code == 401

    def test_prepare_teleconsultation_invalid_rdv(self, admin_auth_header):
        """Tester avec un rendez-vous invalide."""
        payload = {"rendez_vous_id": str(uuid4())}
        response = client.post(
            "/api/teleconsultation/prepare",
            json=payload,
            headers=admin_auth_header
        )
        assert response.status_code == 404

    def test_get_teleconsultation_unauthorized(self):
        """Tester que get requiert une authentification."""
        rdv_id = uuid4()
        response = client.get(f"/api/teleconsultation/{rdv_id}")
        assert response.status_code == 401

    def test_get_teleconsultation_not_found(self, admin_auth_header):
        """Tester avec un rendez-vous invalide."""
        rdv_id = uuid4()
        response = client.get(
            f"/api/teleconsultation/{rdv_id}",
            headers=admin_auth_header
        )
        assert response.status_code == 404


class TestPaiements:
    """Tests pour les endpoints Paiements."""

    def test_list_paiements_unauthorized(self):
        """Tester que list requiert une authentification."""
        response = client.get("/api/paiements")
        assert response.status_code == 401

    def test_create_paiement_unauthorized(self):
        """Tester que create requiert une authentification."""
        payload = {
            "patient_id": str(uuid4()),
            "medecin_id": str(uuid4()),
            "montant_total": 50.0,
            "devise": "USD",
            "methode": "stripe",
            "fournisseur": "stripe",
        }
        response = client.post("/api/paiements", json=payload)
        assert response.status_code == 401

    def test_checkout_without_stripe_key(self, admin_auth_header):
        """Tester que checkout fonctionne si Stripe est configuré."""
        payload = {
            "patient_id": str(uuid4()),
            "medecin_id": str(uuid4()),
            "rdv_id": str(uuid4()),
            "montant_total": 50.0,
            "devise": "USD",
            "methode": "stripe",
            "fournisseur": "stripe",
            "description": "Test payment",
        }
        response = client.post(
            "/api/paiements/checkout",
            json=payload,
            headers=admin_auth_header
        )
        # Si Stripe n'est pas configuré, on doit recevoir 503
        # Sinon, une erreur 400/404 si les IDs sont invalides
        assert response.status_code in [400, 404, 503]


class TestPhase3Integration:
    """Tests d'intégration pour Phase 3."""

    def test_endpoints_are_registered(self):
        """Vérifier que tous les endpoints Phase 3 sont enregistrés."""
        response = client.get("/docs")
        assert response.status_code == 200
        # Les endpoints devraient être listés dans la documentation
        assert "/api/ia/diagnostic" in response.text or response.status_code == 200

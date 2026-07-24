from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum
import secrets
import logging

logger = logging.getLogger(__name__)


class PaymentStatus(Enum):
    INITIE = "initie"
    EN_ATTENTE = "en_attente_confirmation"
    SUCCES = "succes"
    ECHEC = "echoue"
    EXPIRE = "expire"


@dataclass
class PaymentResult:
    success: bool
    reference_fournisseur: str
    transaction_id: str
    status: PaymentStatus
    message: str = ""
    url_paiement: str | None = None


class PaymentProvider(ABC):
    """Interface abstraite pour les fournisseurs de paiement.

    Pour ajouter CinetPay ou Stripe, il suffit de créer une nouvelle classe
    qui hérite de PaymentProvider et d'implémenter initiate() et check_status().
    """

    @abstractmethod
    def initiate(
        self,
        montant: float,
        devise: str,
        reference: str,
        methode: str,
        telephone: str | None = None,
        email: str | None = None,
    ) -> PaymentResult:
        """Initie un paiement. Retourne le résultat avec reference_fournisseur."""
        ...

    @abstractmethod
    def check_status(self, reference_fournisseur: str) -> PaymentStatus:
        """Vérifie le statut d'un paiement auprès du fournisseur."""
        ...


class MockPaymentProvider(PaymentProvider):
    """Fournisseur fictif pour les tests.

    Simule un paiement réussi. À remplacer par CinetPay/Stripe en production.
    """

    def initiate(
        self,
        montant: float,
        devise: str,
        reference: str,
        methode: str,
        telephone: str | None = None,
        email: str | None = None,
    ) -> PaymentResult:
        ref_externe = f"MOCK-{secrets.token_hex(8).upper()}"
        tx_id = f"TX-{secrets.token_hex(6).upper()}"

        logger.info(
            f"[MOCK PAYMENT] {montant} {devise} via {methode} | "
            f"ref={reference} | ref_externe={ref_externe}"
        )

        return PaymentResult(
            success=True,
            reference_fournisseur=ref_externe,
            transaction_id=tx_id,
            status=PaymentStatus.SUCCES,
            message="Paiement simulé avec succès",
        )

    def check_status(self, reference_fournisseur: str) -> PaymentStatus:
        return PaymentStatus.SUCCES


def get_payment_provider() -> PaymentProvider:
    """Factory — retourne le fournisseur configuré.

    Plus tard, remplacer par:
        provider = os.getenv("PAYMENT_PROVIDER", "mock")
        if provider == "cinetpay": return CinetPayProvider(...)
        if provider == "stripe": return StripeProvider(...)
    """
    return MockPaymentProvider()

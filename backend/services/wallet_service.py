from decimal import Decimal
from uuid import UUID

from sqlalchemy.orm import Session

from models import Medecin


def get_solde_portefeuille(db: Session, medecin_id: UUID) -> Decimal:
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        return Decimal("0")
    return Decimal(str(medecin.solde_portefeuille or 0))


def debiter_portefeuille(db: Session, medecin_id: UUID, montant: Decimal) -> bool:
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        return False
    solde = Decimal(str(medecin.solde_portefeuille or 0))
    if solde < montant:
        return False
    medecin.solde_portefeuille = solde - montant
    db.add(medecin)
    return True


def crediter_portefeuille(db: Session, medecin_id: UUID, montant: Decimal) -> bool:
    medecin = db.get(Medecin, medecin_id)
    if not medecin:
        return False
    solde = Decimal(str(medecin.solde_portefeuille or 0))
    medecin.solde_portefeuille = solde + montant
    db.add(medecin)
    return True

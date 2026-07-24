from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


MOMENTS = ["matin", "midi", "soir", "coucher", "personnalise"]
MOMENTS_LABELS = {
    "matin": "le matin",
    "midi": "le midi",
    "soir": "le soir",
    "coucher": "le coucher",
    "personnalise": "",
}

UNITES = ["comprime", "gelule", "ml", "goutte", "sachet", "mg", "autre"]
UNITES_PLURALS = {
    "comprime": "comprimés",
    "gelule": "gélules",
    "ml": "ml",
    "goutte": "gouttes",
    "sachet": "sachets",
    "mg": "mg",
    "autre": "",
}

UNITES_SINGULAR = {
    "comprime": "comprimé",
    "gelule": "gélule",
    "ml": "ml",
    "goutte": "goutte",
    "sachet": "sachet",
    "mg": "mg",
    "autre": "",
}

CONDITIONS = ["avant_repas", "apres_repas", "a_jeun", "sans_lien"]
CONDITIONS_LABELS = {
    "avant_repas": "avant le repas",
    "apres_repas": "après le repas",
    "a_jeun": "à jeun",
    "sans_lien": "",
}


class PriseConfig(BaseModel):
    moment: str = Field(..., description="matin, midi, soir, coucher ou personnalise")
    quantite: float = Field(..., gt=0, description="Quantite par prise (ex: 0.5, 1, 2)")
    unite: str = Field(default="comprime", description="Unite du medicament")
    heure: Optional[str] = Field(default=None, description="Heure si moment personnalise, ex: 14:30")


class PosologieConfig(BaseModel):
    prises: List[PriseConfig] = Field(..., min_length=1, max_length=6)
    condition_repas: str = Field(default="sans_lien")
    duree_jours: int = Field(..., gt=0, le=365)
    instructions_speciales: Optional[str] = None


def _format_quantite(quantite: float, unite: str) -> str:
    if quantite == int(quantite):
        q = str(int(quantite))
    else:
        q = str(quantite).replace(".", ",")
    label = UNITES_PLURALS.get(unite, unite)
    return f"{q} {label}"


def _moment_label(prise: PriseConfig) -> str:
    if prise.moment == "personnalise" and prise.heure:
        return f"à {prise.heure}"
    return MOMENTS_LABELS.get(prise.moment, prise.moment)


def _group_prises(prises: List[PriseConfig]) -> List[str]:
    groups = []
    for p in prises:
        parts = []
        if p.quantite and p.unite:
            parts.append(_format_quantite(p.quantite, p.unite))
        moment = _moment_label(p)
        if moment:
            parts.append(moment)
        groups.append(" ".join(parts))
    return groups


def generer_posologie(config: PosologieConfig) -> str:
    parts = _group_prises(config.prises)

    if not parts:
        return ""

    if len(parts) == 1:
        texte = parts[0]
    elif len(parts) == 2:
        texte = f"{parts[0]} et {parts[1]}"
    else:
        texte = ", ".join(parts[:-1]) + f" et {parts[-1]}"

    condition = CONDITIONS_LABELS.get(config.condition_repas, "")
    if condition:
        texte += f", {condition}"

    if config.duree_jours:
        if config.duree_jours == 1:
            texte += ", pendant 1 jour"
        else:
            texte += f", pendant {config.duree_jours} jours"

    if config.instructions_speciales:
        texte += f". {config.instructions_speciales}"

    texte += "."
    return texte[0].upper() + texte[1:]

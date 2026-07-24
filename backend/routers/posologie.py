from fastapi import APIRouter

from posologie import (
    CONDITIONS,
    MOMENTS,
    UNITES,
    PosologieConfig,
    generer_posologie,
)

router = APIRouter(tags=["posologie"])


@router.post("/posologie/generate")
async def generate_posologie(config: PosologieConfig):
    texte = generer_posologie(config)
    return {"posologie": texte}


@router.get("/posologie/constants")
async def get_posologie_constants():
    return {
        "moments": MOMENTS,
        "unites": UNITES,
        "conditions": CONDITIONS,
    }

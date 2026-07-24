from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import AvisStructure, Structure, User
from schemas import DocumentStructureCreate, StructureCreate, StructureRead, StructureUpdate

router = APIRouter(tags=["structures"])


@router.get("/structures", response_model=list[StructureRead])
async def list_structures(
    limit: int = Query(50, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    rating_sub = (
        select(
            AvisStructure.structure_id,
            func.coalesce(func.avg(AvisStructure.note), 0).label("moyenne"),
            func.count(AvisStructure.id).label("total"),
        )
        .group_by(AvisStructure.structure_id)
        .subquery()
    )
    stmt = (
        select(Structure, rating_sub.c.moyenne, rating_sub.c.total)
        .outerjoin(rating_sub, Structure.id == rating_sub.c.structure_id)
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    results = []
    for struct, moyenne, total in rows:
        data = StructureRead.model_validate(struct)
        data.note_moyenne = round(float(moyenne), 1) if moyenne else None
        data.total_avis = total or 0
        results.append(data)
    return results


@router.post("/structures", status_code=status.HTTP_201_CREATED)
async def create_structure(
    structure_create: StructureCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    import secrets
    import string
    from auth import get_password_hash

    user_id = structure_create.id or uuid4()
    email = structure_create.email_pro or f"struct-{secrets.token_hex(4)}@nere.health"

    password_chars = string.ascii_letters + string.digits
    generated_password = "".join(secrets.choice(password_chars) for _ in range(12))
    hashed = get_password_hash(generated_password)

    user = User(
        id=user_id,
        email=email,
        nom=structure_create.nom_etablissement,
        prenom="",
        telephone=structure_create.telephone_pro,
        role="structure",
        mot_de_passe_hash=hashed,
    )
    db.add(user)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de l'utilisateur structure")

    structure_create.id = user_id
    structure = Structure(**structure_create.dict(exclude_unset=True))
    db.add(structure)
    try:
        db.commit()
        db.refresh(structure)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Erreur de création de la structure") from exc

    return {
        "id": structure.id,
        "nom_etablissement": structure.nom_etablissement,
        "email": email,
        "mot_de_passe_genere": generated_password,
    }


@router.get("/structures/{structure_id}", response_model=StructureRead)
async def read_structure(
    structure_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")
    return structure


@router.put("/structures/{structure_id}", response_model=StructureRead)
async def update_structure(
    structure_id: UUID,
    structure_update: StructureUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")

    for field, value in structure_update.dict(exclude_unset=True).items():
        setattr(structure, field, value)

    db.add(structure)
    try:
        db.commit()
        db.refresh(structure)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Erreur de mise à jour de la structure: {exc.orig}") from exc
    return structure


@router.delete("/structures/{structure_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_structure(
    structure_id: UUID,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")
    db.delete(structure)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/structures/{structure_id}/documents", response_model=StructureRead)
async def add_structure_document(
    structure_id: UUID,
    document: DocumentStructureCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")

    docs = list(structure.documents or [])
    docs.append({"nom": document.nom, "type": document.type, "taille": document.taille, "url": document.url})
    structure.documents = docs

    db.add(structure)
    db.commit()
    db.refresh(structure)
    return structure


@router.delete("/structures/{structure_id}/documents/{doc_index}", response_model=StructureRead)
async def remove_structure_document(
    structure_id: UUID,
    doc_index: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")

    docs = list(structure.documents or [])
    if doc_index < 0 or doc_index >= len(docs):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Index de document invalide")

    docs.pop(doc_index)
    structure.documents = docs

    db.add(structure)
    db.commit()
    db.refresh(structure)
    return structure

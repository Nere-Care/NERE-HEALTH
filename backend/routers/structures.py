from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth import get_current_active_user, require_role
from db import get_db
from models import AvisStructure, Medecin, Structure, User
from schemas import DocumentStructureCreate, StructureCreate, StructureRead, StructureUpdate

router = APIRouter(tags=["structures"])


def sync_structure_professionnel_count(db: Session, *structure_ids: UUID):
    db.flush()
    for sid in structure_ids:
        if not sid:
            continue
        count = db.query(func.count()).select_from(Medecin).filter(Medecin.structure_id == sid).scalar()
        structure = db.get(Structure, sid)
        if structure:
            structure.nombre_professionnels = count or 0
            db.add(structure)
    if structure_ids:
        db.flush()


@router.get("/structures/list")
async def list_structures_simple(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Structure.id, Structure.nom_etablissement)
        .order_by(Structure.nom_etablissement)
    ).all()
    return [{"id": str(r.id), "nom_etablissement": r.nom_etablissement} for r in rows]


class StructurePublicCreate(BaseModel):
    nom_etablissement: str
    adresse: str
    ville: str = "Douala"
    telephone_pro: str | None = None


@router.post("/structures/public", status_code=status.HTTP_201_CREATED)
async def create_structure_public(body: StructurePublicCreate, db: Session = Depends(get_db)):
    import secrets
    import string as pystring
    from auth import get_password_hash

    if not body.nom_etablissement.strip():
        raise HTTPException(status_code=400, detail="Le nom de la structure est requis")
    if not body.adresse.strip():
        raise HTTPException(status_code=400, detail="L'adresse de la structure est requise")

    exists = db.query(Structure).filter(
        Structure.nom_etablissement.ilike(f"%{body.nom_etablissement.strip()}%")
    ).first()
    if exists:
        return {"id": str(exists.id), "nom_etablissement": exists.nom_etablissement, "created": False}

    user_id = uuid4()
    email = f"struct-{secrets.token_hex(4)}@nere.health"
    password_chars = pystring.ascii_letters + pystring.digits
    generated_password = "".join(secrets.choice(password_chars) for _ in range(12))
    hashed = get_password_hash(generated_password)

    user = User(
        id=user_id,
        email=email,
        nom=body.nom_etablissement.strip(),
        prenom="",
        telephone=body.telephone_pro,
        role="structure",
        mot_de_passe_hash=hashed,
        statut="actif",
    )
    db.add(user)
    db.flush()

    structure = Structure(
        id=user_id,
        nom_etablissement=body.nom_etablissement.strip(),
        type="clinique_privee",
        adresse=body.adresse.strip(),
        ville=body.ville.strip() or "Douala",
        pays="CM",
        telephone_pro=body.telephone_pro,
    )
    db.add(structure)
    try:
        db.commit()
        db.refresh(structure)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail="Erreur de création de la structure") from exc

    return {"id": str(structure.id), "nom_etablissement": structure.nom_etablissement, "created": True}


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
    prof_sub = (
        select(Medecin.structure_id, func.count(Medecin.id).label("nb"))
        .where(Medecin.structure_id.isnot(None))
        .group_by(Medecin.structure_id)
        .subquery()
    )
    stmt = (
        select(Structure, rating_sub.c.moyenne, rating_sub.c.total, func.coalesce(prof_sub.c.nb, 0))
        .outerjoin(rating_sub, Structure.id == rating_sub.c.structure_id)
        .outerjoin(prof_sub, Structure.id == prof_sub.c.structure_id)
        .limit(limit)
    )
    rows = db.execute(stmt).all()
    results = []
    for struct, moyenne, total, nb in rows:
        data = StructureRead.model_validate(struct)
        data.note_moyenne = round(float(moyenne), 1) if moyenne else None
        data.total_avis = total or 0
        data.nombre_professionnels = nb or 0
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
    nb = (
        db.query(func.count())
        .select_from(Medecin)
        .filter(Medecin.structure_id == structure_id)
        .scalar()
        or 0
    )
    structure.nombre_professionnels = nb
    return structure


@router.get("/structures/{structure_id}/medecins")
async def list_structure_medecins(
    structure_id: UUID,
    q: str = Query("", description="Recherche par nom, prénom ou spécialité"),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    structure = db.get(Structure, structure_id)
    if not structure:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Structure non trouvée")

    stmt = (
        select(Medecin, User.prenom, User.nom, User.email, User.telephone, User.photo_url)
        .join(User, Medecin.id == User.id)
        .where(Medecin.structure_id == structure_id)
        .where(User.statut != "banni")
        .where(Medecin.statut_verification == "verifie")
    )
    rows = db.execute(stmt).all()

    from models import MedecinSpecialite, Specialite

    medecin_ids = [row[0].id for row in rows]
    spec_stmt = (
        select(MedecinSpecialite, Specialite.libelle_fr)
        .join(Specialite, MedecinSpecialite.specialite_id == Specialite.id)
        .where(MedecinSpecialite.medecin_id.in_(medecin_ids)) if medecin_ids else select(MedecinSpecialite, Specialite.libelle_fr).where(False)
    )
    spec_rows = db.execute(spec_stmt).all()
    spec_map = {}
    for ms, libelle in spec_rows:
        spec_map.setdefault(str(ms.medecin_id), []).append({
            "specialite": libelle,
            "principale": ms.principale,
            "annees_pratique": ms.annees_pratique,
        })

    results = []
    q_lower = q.strip().lower()
    for row in rows:
        medecin = row[0]
        prenom = row[1] or ""
        nom = row[2] or ""
        email = row[3] or ""
        telephone = row[4] or ""
        photo_url = row[5] or ""
        full_name = f"{prenom} {nom}".strip()
        specs = spec_map.get(str(medecin.id), [])
        spec_names = [s["specialite"] for s in specs]

        if q_lower:
            searchable = f"{full_name} {email} {' '.join(spec_names)}".lower()
            if q_lower not in searchable:
                continue

        results.append({
            "id": str(medecin.id),
            "prenom": prenom,
            "nom": nom,
            "nom_complet": full_name,
            "email": email,
            "telephone": telephone,
            "photo_url": photo_url,
            "specialites": specs,
            "specialite_principale": next((s["specialite"] for s in specs if s["principale"]), spec_names[0] if spec_names else ""),
            "annees_experience": medecin.annees_experience,
            "note_moyenne": float(medecin.note_moyenne or 0),
            "tarif_consultation": float(medecin.tarif_consultation or 0),
            "devise": medecin.devise or "XAF",
            "disponible_maintenant": medecin.disponible_maintenant,
            "biographie": medecin.biographie or "",
        })

    return results


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
    user = db.get(User, structure_id)
    if user:
        user.statut = "supprime"
        db.add(user)
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

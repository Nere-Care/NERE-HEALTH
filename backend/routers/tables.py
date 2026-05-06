from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import insert, select
from sqlalchemy.exc import NoSuchTableError
from sqlalchemy.orm import Session

from backend.auth import require_role
from backend.db import get_db
from backend.models import get_model, prepare_models

router = APIRouter()


def _get_primary_key_column(model):
    pks = [col for col in model.__table__.primary_key.columns]
    if len(pks) != 1:
        return None
    return pks[0]


@router.get("/tables", tags=["database"])
async def list_tables(current_user=Depends(require_role("admin"))):
    try:
        metadata = prepare_models().metadata
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database schema reflection failed: {exc}")
    return {"tables": sorted(metadata.tables.keys())}


@router.get("/tables/{table_name}", tags=["database"])
async def list_table_rows(
    table_name: str,
    limit: int = Query(20, gt=0, le=200),
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    try:
        model = get_model(table_name)
    except NoSuchTableError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    stmt = select(model.__table__).limit(limit)
    try:
        rows = db.execute(stmt).mappings().all()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Query failed: {exc}")

    return {"table": table_name, "limit": limit, "rows": [dict(row) for row in rows]}


@router.get("/tables/{table_name}/count", tags=["database"])
async def count_table_rows(
    table_name: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    try:
        model = get_model(table_name)
    except NoSuchTableError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    stmt = select(model.__table__.count())
    try:
        count = db.execute(stmt).scalar_one()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Count query failed: {exc}")

    return {"table": table_name, "count": count}


@router.get("/tables/{table_name}/{pk}", tags=["database"])
async def get_table_row(
    table_name: str,
    pk: str,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    try:
        model = get_model(table_name)
    except NoSuchTableError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    pk_column = _get_primary_key_column(model)
    if pk_column is None:
        raise HTTPException(status_code=400, detail="This table does not have a single primary key column")

    stmt = select(model.__table__).where(pk_column == pk)
    row = db.execute(stmt).mappings().first()
    if not row:
        raise HTTPException(status_code=404, detail="Row not found")
    return dict(row)


@router.post("/tables/{table_name}", tags=["database"])
async def create_table_row(
    table_name: str,
    values: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin")),
):
    try:
        model = get_model(table_name)
    except NoSuchTableError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

    table = model.__table__
    sanitized = {k: v for k, v in values.items() if k in table.columns}
    if not sanitized:
        raise HTTPException(status_code=400, detail="No valid columns provided for insertion")

    stmt = insert(table).values(**sanitized).returning(*table.columns)
    try:
        result = db.execute(stmt)
        db.commit()
        inserted = result.fetchone()
        return {"table": table_name, "inserted": dict(inserted)}
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Insert failed: {exc}")

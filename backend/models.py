from sqlalchemy import MetaData
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.exc import NoSuchTableError

from db import engine


def prepare_models():
    """Reflect the PostgreSQL schema into SQLAlchemy metadata on demand."""
    metadata = MetaData()
    metadata.reflect(bind=engine, extend_existing=True)
    AutomapBase = automap_base(metadata=metadata)
    AutomapBase.prepare()
    return AutomapBase


def _table_to_classname(table_name: str) -> str:
    return "".join(word.capitalize() for word in table_name.split("_"))


def get_model(table_name: str):
    """Return a reflected SQLAlchemy ORM class for the given table."""
    base = prepare_models()
    candidate_names = [table_name, _table_to_classname(table_name)]
    for name in candidate_names:
        if hasattr(base.classes, name):
            return getattr(base.classes, name)

    raise NoSuchTableError(f"Table '{table_name}' not found in reflected schema")

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool
from alembic import context

# Allow import from workspace root for package-style imports.
ROOT_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, ROOT_PATH)

config = context.config
fileConfig(config.config_file_name)


def get_target_metadata():
    from backend.config import _get_settings_instance
    from backend.db import Base

    config.set_main_option("sqlalchemy.url", _get_settings_instance().DATABASE_URL)
    return Base.metadata


def run_migrations_offline():
    target_metadata = get_target_metadata()
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    target_metadata = get_target_metadata()
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with connection.begin():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

from logging.config import fileConfig
import getpass

from alembic import context
from sqlalchemy import create_engine, engine_from_config, pool
from sqlalchemy.exc import OperationalError

from app.core.config import settings
from app.db.base_class import Base
from app.db import base  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def _run_with_engine(connectable) -> None:
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    try:
        _run_with_engine(connectable)
        return
    except OperationalError:
        pass

    try:
        password = getpass.getpass("PostgreSQL password for user '%s': " % settings.POSTGRES_USER)
    except EOFError as exc:
        raise RuntimeError(
            "Database authentication failed and no interactive prompt is available. "
            "Set POSTGRES_PASSWORD in backend/.env and rerun `alembic upgrade head`."
        ) from exc

    retry_url = (
        f"postgresql+psycopg2://{settings.POSTGRES_USER}:{password}"
        f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
    )
    retry_engine = create_engine(retry_url, poolclass=pool.NullPool)

    try:
        _run_with_engine(retry_engine)
    except OperationalError as exc:
        raise RuntimeError(
            "Database authentication failed. Update POSTGRES_USER/POSTGRES_PASSWORD in backend/.env, "
            "then rerun `alembic upgrade head`."
        ) from exc


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

"""Alembic environment. One revision per phase (architecture §5.2)."""

from __future__ import annotations

from alembic import context
from sqlmodel import SQLModel

from cabos_api.db import make_engine
from cabos_api.settings import get_settings

target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    from cabos_api.db import resolve_database_url

    context.configure(
        url=resolve_database_url(get_settings()),
        target_metadata=target_metadata,
        literal_binds=True,
        render_as_batch=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = context.config.attributes.get("connection")
    if connectable is not None:  # tests pass an existing connection
        context.configure(
            connection=connectable, target_metadata=target_metadata, render_as_batch=True
        )
        with context.begin_transaction():
            context.run_migrations()
        return
    engine = make_engine(get_settings())
    with engine.connect() as connection:
        # render_as_batch lets ALTER TABLE migrations run on SQLite too.
        context.configure(
            connection=connection, target_metadata=target_metadata, render_as_batch=True
        )
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

"""Engine factory: PostgreSQL when DATABASE_URL is set, otherwise SQLite in WAL mode (ADR-018)."""

from __future__ import annotations

from typing import Any

from sqlalchemy import Engine, create_engine, event

from cabos_api.settings import Settings


def resolve_database_url(settings: Settings) -> str:
    url = settings.database_url
    if not url:
        return f"sqlite:///{settings.sqlite_path}"
    # Normalise common Postgres spellings to the psycopg 3 driver.
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url[len(prefix) :]
    return url


def _sqlite_pragmas(dbapi_connection: Any, _record: Any) -> None:
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.close()


def make_engine(settings: Settings) -> Engine:
    url = resolve_database_url(settings)
    if url.startswith("sqlite"):
        if url != "sqlite://" and ":memory:" not in url:
            settings.sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        engine = create_engine(url, connect_args={"check_same_thread": False})
        event.listen(engine, "connect", _sqlite_pragmas)
        return engine
    return create_engine(url, pool_pre_ping=True)

from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import inspect, text

from cabos_api.db import make_engine, resolve_database_url
from cabos_api.settings import Settings

API_DIR = Path(__file__).resolve().parents[1]


@pytest.mark.parametrize(
    ("given", "expected"),
    [
        ("postgres://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
        ("postgresql://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
        ("postgresql+psycopg://u:p@h/db", "postgresql+psycopg://u:p@h/db"),
    ],
)
def test_postgres_urls_use_psycopg3(given: str, expected: str) -> None:
    assert resolve_database_url(Settings(database_url=given)) == expected


def test_sqlite_fallback_when_unset(tmp_path: Path) -> None:
    settings = Settings(database_url=None, sqlite_path=tmp_path / "x" / "cabos.db")
    assert resolve_database_url(settings) == f"sqlite:///{tmp_path / 'x' / 'cabos.db'}"


def test_sqlite_uses_wal_and_foreign_keys(tmp_path: Path) -> None:
    engine = make_engine(Settings(database_url=None, sqlite_path=tmp_path / "cabos.db"))
    with engine.connect() as conn:
        assert conn.execute(text("PRAGMA journal_mode")).scalar() == "wal"
        assert conn.execute(text("PRAGMA foreign_keys")).scalar() == 1
    engine.dispose()


def test_migrations_upgrade_and_downgrade(settings: Settings) -> None:
    engine = make_engine(settings)
    cfg = Config(str(API_DIR / "alembic.ini"))
    with engine.begin() as conn:
        cfg.attributes["connection"] = conn
        command.upgrade(cfg, "head")
        assert "alembic_version" in inspect(conn).get_table_names()
        assert conn.execute(text("SELECT version_num FROM alembic_version")).scalar() == "0001"
        command.downgrade(cfg, "base")
    engine.dispose()

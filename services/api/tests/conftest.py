from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from cabos_api.main import create_app
from cabos_api.settings import Settings


@pytest.fixture
def settings(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Settings:
    # CI's Postgres job sets DATABASE_URL; locally this is a throwaway SQLite file.
    import os

    return Settings(
        database_url=os.environ.get("DATABASE_URL"),
        sqlite_path=tmp_path / "test.db",
        demo_mode=True,
    )


@pytest.fixture
def client(settings: Settings) -> Iterator[TestClient]:
    with TestClient(create_app(settings), raise_server_exceptions=False) as c:
        yield c

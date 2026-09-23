"""Runtime settings from environment variables (see `.env.example`)."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from cabos_core.config import default_config_dir

REPO_ROOT = default_config_dir().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CABOS_", env_file=REPO_ROOT / ".env", extra="ignore"
    )

    # Unset → zero-setup SQLite at var/cabos.db (ADR-018).
    database_url: str | None = Field(
        default=None, validation_alias=AliasChoices("DATABASE_URL", "CABOS_DATABASE_URL")
    )
    demo_mode: bool = True
    web_origin: str = "http://localhost:3100"
    sqlite_path: Path = REPO_ROOT / "var" / "cabos.db"


@lru_cache
def get_settings() -> Settings:
    return Settings()

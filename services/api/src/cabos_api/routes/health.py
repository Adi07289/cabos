"""Liveness and readiness (architecture §6.2)."""

from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel
from sqlalchemy import Engine, text
from sqlalchemy.exc import SQLAlchemyError

from cabos_api import __version__
from cabos_api.errors import ProblemError

router = APIRouter(tags=["health"])


class Health(BaseModel):
    status: Literal["ok"]
    version: str
    demo_mode: bool


class DatabaseStatus(BaseModel):
    dialect: str
    ok: bool


class Ready(BaseModel):
    status: Literal["ready"]
    database: DatabaseStatus


@router.get("/health")
def health(request: Request) -> Health:
    """The process is up. Does not touch dependencies."""
    return Health(status="ok", version=__version__, demo_mode=request.app.state.settings.demo_mode)


@router.get("/ready", responses={503: {"description": "A dependency is unavailable"}})
def ready(request: Request) -> Ready:
    """Dependencies are reachable. Used by `make dev` and CI before running checks."""
    engine: Engine = request.app.state.engine
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        raise ProblemError(
            503,
            "dependency.database_unavailable",
            f"Database is unreachable ({engine.dialect.name}).",
        ) from exc
    return Ready(status="ready", database=DatabaseStatus(dialect=engine.dialect.name, ok=True))

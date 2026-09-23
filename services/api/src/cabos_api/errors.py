"""RFC 9457 problem+json errors with stable machine-readable codes (architecture §6.1)."""

from __future__ import annotations

import logging
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

PROBLEM_JSON = "application/problem+json"
log = logging.getLogger("cabos.api")


class ProblemError(Exception):
    """Raise from a route to return a problem+json response with a stable `code`."""

    def __init__(
        self,
        status: int,
        code: str,
        detail: str,
        *,
        title: str | None = None,
        extra: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(detail)
        self.status = status
        self.code = code
        self.detail = detail
        self.title = title or HTTPStatus(status).phrase
        self.extra = extra or {}


def problem(
    request: Request,
    status: int,
    code: str,
    detail: str,
    title: str | None = None,
    **extra: Any,
) -> JSONResponse:
    body: dict[str, Any] = {
        "type": f"https://cabos.dev/problems/{code}",
        "title": title or HTTPStatus(status).phrase,
        "status": status,
        "detail": detail,
        "instance": request.url.path,
        "code": code,
        **extra,
    }
    return JSONResponse(body, status_code=status, media_type=PROBLEM_JSON)


def _http_code(status: int) -> str:
    return {
        401: "auth.unauthenticated",
        403: "auth.forbidden",
        404: "http.not_found",
        405: "http.method_not_allowed",
        409: "http.conflict",
    }.get(status, f"http.{status}")


def install_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ProblemError)
    async def _problem(request: Request, exc: ProblemError) -> JSONResponse:
        return problem(request, exc.status, exc.code, exc.detail, exc.title, **exc.extra)

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        return problem(request, exc.status_code, _http_code(exc.status_code), str(exc.detail))

    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = [
            {"loc": list(err.get("loc", ())), "msg": err.get("msg", "")} for err in exc.errors()
        ]
        return problem(
            request, 422, "request.invalid", "The request failed validation.", errors=errors
        )

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        log.exception("unhandled error on %s", request.url.path, exc_info=exc)
        return problem(request, 500, "server.error", "An unexpected error occurred.")

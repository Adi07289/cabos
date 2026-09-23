from fastapi import APIRouter
from fastapi.testclient import TestClient

from cabos_api.errors import PROBLEM_JSON, ProblemError
from cabos_api.main import create_app
from cabos_api.settings import Settings


def test_health(client: TestClient) -> None:
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    body = res.json()
    assert body["status"] == "ok"
    assert body["demo_mode"] is True


def test_ready_reports_database(client: TestClient) -> None:
    res = client.get("/api/v1/ready")
    assert res.status_code == 200
    assert res.json()["database"]["ok"] is True
    assert res.json()["database"]["dialect"] in {"sqlite", "postgresql"}


def test_ready_is_503_problem_when_database_unreachable(settings: Settings) -> None:
    broken = settings.model_copy(
        update={"database_url": "postgresql+psycopg://nobody:x@127.0.0.1:1/none"}
    )
    with TestClient(create_app(broken), raise_server_exceptions=False) as c:
        res = c.get("/api/v1/ready")
    assert res.status_code == 503
    assert res.headers["content-type"] == PROBLEM_JSON
    assert res.json()["code"] == "dependency.database_unavailable"


def test_unknown_route_is_problem_json(client: TestClient) -> None:
    res = client.get("/api/v1/nope")
    assert res.status_code == 404
    assert res.headers["content-type"] == PROBLEM_JSON
    body = res.json()
    assert body["code"] == "http.not_found"
    assert body["instance"] == "/api/v1/nope"


def _app_with_test_routes(settings: Settings) -> TestClient:
    app = create_app(settings)
    router = APIRouter()

    @router.get("/boom")
    def boom() -> None:
        raise RuntimeError("secret internals")

    @router.get("/conflict")
    def conflict() -> None:
        raise ProblemError(409, "shift.walkaround_required", "Complete the walkaround first.")

    @router.get("/typed")
    def typed(n: int) -> int:
        return n

    app.include_router(router, prefix="/t")
    return TestClient(app, raise_server_exceptions=False)


def test_problem_error_keeps_its_code(settings: Settings) -> None:
    res = _app_with_test_routes(settings).get("/t/conflict")
    assert res.status_code == 409
    assert res.json()["code"] == "shift.walkaround_required"


def test_validation_errors_list_locations(settings: Settings) -> None:
    res = _app_with_test_routes(settings).get("/t/typed", params={"n": "x"})
    assert res.status_code == 422
    body = res.json()
    assert body["code"] == "request.invalid"
    assert body["errors"][0]["loc"] == ["query", "n"]


def test_unhandled_errors_do_not_leak_internals(settings: Settings) -> None:
    res = _app_with_test_routes(settings).get("/t/boom")
    assert res.status_code == 500
    assert "secret" not in res.text
    assert res.json()["code"] == "server.error"


def test_openapi_is_served(client: TestClient) -> None:
    assert client.get("/api/v1/openapi.json").json()["info"]["title"] == "CabOS API"

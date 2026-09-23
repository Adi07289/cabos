from datetime import UTC, datetime, timedelta

import pytest

from cabos_core.clock import ManualClock
from cabos_core.config import load_config
from cabos_edge.__main__ import main
from cabos_edge.runtime import EdgeRuntime

T0 = datetime(2025, 5, 1, 2, 30, tzinfo=UTC)


def _runtime(clock: ManualClock) -> EdgeRuntime:
    return EdgeRuntime(clock=clock, safety=load_config().safety)


def test_tick_interval_comes_from_safety_config() -> None:
    assert _runtime(ManualClock(T0)).tick_interval == timedelta(milliseconds=250)


def test_handlers_receive_clock_time() -> None:
    clock = ManualClock(T0)
    runtime = _runtime(clock)
    seen: list[datetime] = []
    runtime.on_tick(seen.append)
    runtime.tick()
    clock.advance(0.25)
    runtime.tick()
    assert seen == [T0, T0 + timedelta(seconds=0.25)]


async def test_run_ticks_on_schedule_without_real_sleeping() -> None:
    clock = ManualClock(T0)
    runtime = _runtime(clock)
    sleeps: list[float] = []

    async def fake_sleep(seconds: float) -> None:
        sleeps.append(seconds)
        clock.advance(seconds)

    ran = await runtime.run(max_ticks=40, sleep=fake_sleep)  # 40 x 250 ms = 10 s grace window
    assert ran == 40
    assert sleeps == [0.25] * 40
    assert runtime.last_tick_at == T0 + timedelta(seconds=9.75)


def test_backwards_clock_is_detected() -> None:
    class Rewinding:
        def __init__(self) -> None:
            self.times = iter([T0, T0 - timedelta(seconds=1)])

        def now(self) -> datetime:
            return next(self.times)

    runtime = EdgeRuntime(clock=Rewinding(), safety=load_config().safety)
    runtime.tick()
    with pytest.raises(RuntimeError, match="backwards"):
        runtime.tick()


def test_cli_runs_a_bounded_loop(caplog: pytest.LogCaptureFixture) -> None:
    caplog.set_level("INFO")
    main(["--ticks", "2", "--speed", "100"])
    assert "stopped after 2 ticks" in caplog.text

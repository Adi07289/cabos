from datetime import UTC, datetime, timedelta

import pytest

from cabos_core.clock import Clock, ManualClock, SimClock, WallClock

T0 = datetime(2025, 5, 1, 2, 30, tzinfo=UTC)


def test_manual_clock_advances_exactly() -> None:
    clock = ManualClock(T0)
    assert clock.now() == T0
    clock.advance(9.99)
    assert clock.now() == T0 + timedelta(seconds=9.99)


def test_manual_clock_rejects_going_backwards() -> None:
    clock = ManualClock(T0)
    with pytest.raises(ValueError, match="backwards"):
        clock.advance(-1)
    with pytest.raises(ValueError, match="backwards"):
        clock.set(T0 - timedelta(seconds=1))


def test_naive_start_is_rejected() -> None:
    with pytest.raises(ValueError, match="timezone-aware"):
        ManualClock(datetime(2025, 5, 1, 8, 0))


def test_sim_clock_compresses_time() -> None:
    ticks = iter([100.0, 102.0])  # construction, then one read 2 real seconds later
    clock = SimClock(T0, speed=30.0, monotonic=lambda: next(ticks))
    assert clock.now() == T0 + timedelta(seconds=60)


def test_sim_clock_speed_change_has_no_jump() -> None:
    real = [0.0]
    clock = SimClock(T0, speed=10.0, monotonic=lambda: real[0])
    real[0] = 1.0
    before = clock.now()
    clock.set_speed(60.0)
    assert clock.now() == before
    real[0] = 2.0
    assert clock.now() == before + timedelta(seconds=60)


def test_all_clocks_satisfy_protocol_and_return_utc() -> None:
    for clock in (WallClock(), ManualClock(T0), SimClock(T0)):
        assert isinstance(clock, Clock)
        assert clock.now().tzinfo is not None

"""Injectable clocks (ADR-004).

Domain logic never reads the system time. Services pass a `Clock` in, and tests use
`ManualClock` so that time-based transitions (10 s grace, 30 s alarm...) are exact.
This is the only module allowed to touch the real system clock.
"""

from __future__ import annotations

import time
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Protocol, runtime_checkable


@runtime_checkable
class Clock(Protocol):
    def now(self) -> datetime:
        """Current time as a timezone-aware UTC datetime."""
        ...


def _require_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        raise ValueError("clock times must be timezone-aware (UTC)")
    return value.astimezone(UTC)


class WallClock:
    """Real time. Used by running services only."""

    def now(self) -> datetime:
        return datetime.now(UTC)


class ManualClock:
    """Time that moves only when told to. Used by tests and deterministic replays."""

    def __init__(self, start: datetime) -> None:
        self._now = _require_utc(start)

    def now(self) -> datetime:
        return self._now

    def advance(self, seconds: float) -> datetime:
        if seconds < 0:
            raise ValueError("a clock cannot move backwards")
        self._now += timedelta(seconds=seconds)
        return self._now

    def set(self, value: datetime) -> None:
        value = _require_utc(value)
        if value < self._now:
            raise ValueError("a clock cannot move backwards")
        self._now = value


class SimClock:
    """Simulated time that runs `speed` times faster than real time from `start`.

    Used by the demo to compress a shift into minutes. `monotonic` is injectable so the
    class itself is testable without sleeping.
    """

    def __init__(
        self,
        start: datetime,
        speed: float = 1.0,
        monotonic: Callable[[], float] = time.monotonic,
    ) -> None:
        if speed <= 0:
            raise ValueError("speed must be positive")
        self._origin = _require_utc(start)
        self._speed = speed
        self._monotonic = monotonic
        self._t0 = monotonic()

    @property
    def speed(self) -> float:
        return self._speed

    def now(self) -> datetime:
        elapsed = (self._monotonic() - self._t0) * self._speed
        return self._origin + timedelta(seconds=elapsed)

    def set_speed(self, speed: float) -> None:
        """Change speed without a jump in simulated time."""
        if speed <= 0:
            raise ValueError("speed must be positive")
        self._origin = self.now()
        self._t0 = self._monotonic()
        self._speed = speed

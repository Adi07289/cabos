"""Clock-driven runtime loop.

The loop evaluates on a fixed tick (`safety.seatbelt.tick_ms`, 250 ms by default) so that
time-based safety transitions fire within one tick of their deadline. Each tick receives the
clock's `now`, so a `ManualClock` gives exact, sleep-free tests and a `SimClock` compresses a
demo shift (ADR-004).
"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from cabos_core.clock import Clock
from cabos_core.config import SafetyConfig

TickHandler = Callable[[datetime], None]
Sleeper = Callable[[float], Awaitable[None]]


@dataclass
class EdgeRuntime:
    clock: Clock
    safety: SafetyConfig
    handlers: list[TickHandler] = field(default_factory=list)
    ticks: int = 0
    last_tick_at: datetime | None = None

    @property
    def tick_interval(self) -> timedelta:
        return timedelta(milliseconds=self.safety.seatbelt.tick_ms)

    def on_tick(self, handler: TickHandler) -> None:
        self.handlers.append(handler)

    def tick(self) -> datetime:
        """Run one evaluation at the clock's current time."""
        now = self.clock.now()
        if self.last_tick_at is not None and now < self.last_tick_at:
            raise RuntimeError("clock moved backwards between ticks")
        for handler in self.handlers:
            handler(now)
        self.ticks += 1
        self.last_tick_at = now
        return now

    async def run(self, max_ticks: int | None = None, sleep: Sleeper = asyncio.sleep) -> int:
        """Tick until cancelled (or `max_ticks`). Returns the number of ticks run."""
        interval_s = self.tick_interval.total_seconds()
        start = self.ticks
        while max_ticks is None or self.ticks - start < max_ticks:
            self.tick()
            await sleep(interval_s)
        return self.ticks - start

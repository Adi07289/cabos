"""`uv run cabos-edge [--ticks N] [--speed K]`: run the edge loop standalone (EDGE_MODE=process)."""

from __future__ import annotations

import argparse
import asyncio
import logging

from cabos_core.clock import SimClock, WallClock
from cabos_core.config import load_config
from cabos_edge.runtime import EdgeRuntime


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="cabos-edge")
    parser.add_argument("--ticks", type=int, default=None, help="stop after N ticks")
    parser.add_argument("--speed", type=float, default=1.0, help="simulated-time multiplier")
    args = parser.parse_args(argv)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
    log = logging.getLogger("cabos.edge")

    config = load_config()
    wall = WallClock()
    clock = wall if args.speed == 1.0 else SimClock(wall.now(), speed=args.speed)
    runtime = EdgeRuntime(clock=clock, safety=config.safety)
    log.info(
        "edge runtime starting: tick=%sms speed=%sx", config.safety.seatbelt.tick_ms, args.speed
    )
    try:
        ran = asyncio.run(runtime.run(max_ticks=args.ticks))
        log.info("edge runtime stopped after %d ticks", ran)
    except KeyboardInterrupt:
        log.info("edge runtime interrupted after %d ticks", runtime.ticks)


if __name__ == "__main__":
    main()

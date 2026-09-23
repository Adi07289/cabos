"""CabOS domain core.

Everything in this package is pure: no network, no database, no filesystem writes, and no
hidden time or randomness. Time arrives through a `Clock` (or an explicit `now` argument) and
randomness through `cabos_core.rng`. `tests/test_determinism.py` enforces this.
"""

__version__ = "0.1.0"

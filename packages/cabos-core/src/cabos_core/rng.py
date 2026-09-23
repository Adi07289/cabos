"""Seeded randomness (ADR-004).

Every random draw in CabOS comes from a generator built here, keyed by a seed and a stream
name, so that independent components (for example two simulated workers) get independent but
reproducible sequences. Python's built-in `hash()` is salted per process, so stream names are
hashed with CRC32 instead.
"""

from __future__ import annotations

import zlib

import numpy as np

DEFAULT_SEED = 20250501


def stream_key(name: str) -> int:
    return zlib.crc32(name.encode("utf-8"))


def generator(seed: int = DEFAULT_SEED, stream: str = "") -> np.random.Generator:
    """A reproducible PCG64 generator for `(seed, stream)`."""
    entropy = [seed, stream_key(stream)] if stream else [seed]
    return np.random.Generator(np.random.PCG64(np.random.SeedSequence(entropy)))

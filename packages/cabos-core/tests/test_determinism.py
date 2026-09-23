"""ADR-004: domain code must not read the system clock or use unseeded randomness."""

import re
from pathlib import Path

import cabos_core

CORE = Path(cabos_core.__file__).parent
ALLOWED = {"clock.py"}  # the one module that wraps the real clock
FORBIDDEN = {
    r"datetime\.now\(": "use a Clock or an explicit `now` argument",
    r"datetime\.utcnow\(": "use a Clock",
    r"date\.today\(": "use a Clock",
    r"\btime\.time\(": "use a Clock",
    r"^\s*import random\b|^\s*from random import": "use cabos_core.rng",
    r"np\.random\.seed\(|np\.random\.(rand|randn|randint|random|choice|normal)\(": (
        "use cabos_core.rng.generator"
    ),
    r"default_rng\(\s*\)": "pass a seed",
}


def test_core_has_no_hidden_time_or_randomness() -> None:
    violations: list[str] = []
    for path in sorted(CORE.rglob("*.py")):
        if path.name in ALLOWED:
            continue
        for lineno, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            for pattern, fix in FORBIDDEN.items():
                if re.search(pattern, line):
                    rel = path.relative_to(CORE)
                    violations.append(f"{rel}:{lineno}: {line.strip()}  ({fix})")
    assert not violations, "\n".join(violations)

"""Task type → task family (ADR-009): the middle step of the unseen-category fallback."""

from __future__ import annotations

import re

from cabos_core.config import TaskFamiliesConfig

_SEPARATORS = re.compile(r"[\s_\-/]+")


def normalise_task_type(raw: str) -> str:
    return _SEPARATORS.sub(" ", raw.strip().lower())


def task_family(task_type: str, config: TaskFamiliesConfig) -> str:
    """First family (in config order) whose keyword appears in the task type."""
    text = normalise_task_type(task_type)
    for rule in config.families:
        if any(keyword in text for keyword in rule.keywords):
            return rule.name
    return config.fallback

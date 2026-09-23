"""Typed, validated views of the YAML files in `config/`.

Each file has a Pydantic model. A config that breaks an invariant (for example a seatbelt
alarm that fires before the warning) fails at load time rather than in the cab.
Reading files is the only I/O here; everything else takes the parsed models.
"""

from __future__ import annotations

from pathlib import Path
from typing import Annotated, Self

import yaml
from pydantic import BaseModel, ConfigDict, Field, model_validator

PositiveFloat = Annotated[float, Field(gt=0)]
Multiplier = Annotated[float, Field(ge=1.0)]


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


# --- safety.yaml ----------------------------------------------------------------------------


class SeatbeltConfig(_Strict):
    grace_s: PositiveFloat
    alarm_s: PositiveFloat
    escalate_s: PositiveFloat
    moving_speed_kmh: PositiveFloat
    flapping_toggles_per_min: Annotated[int, Field(ge=1)]
    unknown_fault_s: PositiveFloat
    sensor_recovery_s: PositiveFloat
    tick_ms: Annotated[int, Field(ge=10, le=1000)]

    @model_validator(mode="after")
    def _ordered(self) -> Self:
        if not self.grace_s < self.alarm_s < self.escalate_s:
            raise ValueError("seatbelt timings must satisfy grace_s < alarm_s < escalate_s")
        return self


class Bands(_Strict):
    stop: PositiveFloat
    danger: PositiveFloat
    caution: PositiveFloat
    aware: PositiveFloat

    @model_validator(mode="after")
    def _increasing(self) -> Self:
        if not self.stop < self.danger < self.caution < self.aware:
            raise ValueError("proximity bands must satisfy stop < danger < caution < aware")
        return self


class TtcBands(_Strict):
    stop: PositiveFloat
    danger: PositiveFloat
    caution: PositiveFloat

    @model_validator(mode="after")
    def _increasing(self) -> Self:
        if not self.stop < self.danger < self.caution:
            raise ValueError("TTC bands must satisfy stop < danger < caution")
        return self


class ConditionMultipliers(_Strict):
    rain: Multiplier
    fog: Multiplier
    night: Multiplier


class ProximityConfig(_Strict):
    eval_hz: Annotated[int, Field(ge=1, le=50)]
    band_offset_m: Bands
    ttc_s: TtcBands
    min_closing_mps: PositiveFloat
    downgrade_hold_s: PositiveFloat
    travel_lookahead_s: PositiveFloat
    condition_multiplier: ConditionMultipliers
    max_multiplier: Multiplier


class WindLimits(_Strict):
    demolition: PositiveFloat
    lift: PositiveFloat


class HeatIndex(_Strict):
    caution: float
    danger: float

    @model_validator(mode="after")
    def _ordered(self) -> Self:
        if not self.caution < self.danger:
            raise ValueError("heat index caution must be below danger")
        return self


class ConditionsConfig(_Strict):
    wind_limit_kmh: WindLimits
    rain_slope_factor: Annotated[float, Field(gt=0, le=1)]
    heat_index_c: HeatIndex


class FatigueConfig(_Strict):
    continuous_limit_min: PositiveFloat
    heat_caution_limit_min: PositiveFloat
    heat_danger_limit_min: PositiveFloat

    @model_validator(mode="after")
    def _ordered(self) -> Self:
        if not (
            self.heat_danger_limit_min < self.heat_caution_limit_min <= self.continuous_limit_min
        ):
            raise ValueError("fatigue limits must shorten as heat rises")
        return self


class LinkConfig(_Strict):
    heartbeat_s: PositiveFloat
    lost_after_s: PositiveFloat

    @model_validator(mode="after")
    def _ordered(self) -> Self:
        if not self.lost_after_s > 2 * self.heartbeat_s:
            raise ValueError("lost_after_s must exceed two heartbeats to avoid false alarms")
        return self


class SafetyConfig(_Strict):
    version: int
    seatbelt: SeatbeltConfig
    proximity: ProximityConfig
    conditions: ConditionsConfig
    fatigue: FatigueConfig
    link: LinkConfig


# --- priors.yaml ----------------------------------------------------------------------------


class PriorsConfig(_Strict):
    version: int
    prior_strength: PositiveFloat
    residual_sigma_log: PositiveFloat
    intercept_log: float
    weather: dict[str, float]
    operator_skill: dict[str, float]
    task_family: dict[str, float]
    machine_age_per_year: float


# --- task_families.yaml ---------------------------------------------------------------------


class FamilyRule(_Strict):
    name: str
    keywords: list[str] = Field(min_length=1)


class TaskFamiliesConfig(_Strict):
    version: int
    fallback: str
    families: list[FamilyRule] = Field(min_length=1)

    @model_validator(mode="after")
    def _unique(self) -> Self:
        names = [f.name for f in self.families]
        if len(names) != len(set(names)):
            raise ValueError("family names must be unique")
        return self


# --- synonyms.yaml --------------------------------------------------------------------------


class HeaderSynonyms(_Strict):
    telemetry: dict[str, list[str]]
    tasks: dict[str, list[str]]


class SynonymsConfig(_Strict):
    version: int
    headers: HeaderSynonyms
    categories: dict[str, dict[str, list[str]]]

    @model_validator(mode="after")
    def _no_ambiguous_aliases(self) -> Self:
        for kind, table in (("telemetry", self.headers.telemetry), ("tasks", self.headers.tasks)):
            seen: dict[str, str] = {}
            for canonical, aliases in table.items():
                for alias in aliases:
                    if seen.get(alias, canonical) != canonical:
                        raise ValueError(
                            f"{kind} header alias {alias!r} maps to both "
                            f"{seen[alias]!r} and {canonical!r}"
                        )
                    seen[alias] = canonical
        for category, values in self.categories.items():
            seen_values: dict[str, str] = {}
            for canonical, aliases in values.items():
                for alias in aliases:
                    if seen_values.get(alias, canonical) != canonical:
                        raise ValueError(f"category {category!r}: {alias!r} is ambiguous")
                    seen_values[alias] = canonical
        return self


# --- loading --------------------------------------------------------------------------------


class CabosConfig(_Strict):
    safety: SafetyConfig
    priors: PriorsConfig
    task_families: TaskFamiliesConfig
    synonyms: SynonymsConfig


def _read(path: Path) -> object:
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)


def default_config_dir() -> Path:
    """`<repo>/config`, found by walking up from this file (works in the uv workspace)."""
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "config" / "safety.yaml"
        if candidate.is_file():
            return candidate.parent
    raise FileNotFoundError("could not locate the repository config/ directory")


def load_config(config_dir: Path | None = None) -> CabosConfig:
    root = config_dir or default_config_dir()
    return CabosConfig(
        safety=SafetyConfig.model_validate(_read(root / "safety.yaml")),
        priors=PriorsConfig.model_validate(_read(root / "priors.yaml")),
        task_families=TaskFamiliesConfig.model_validate(_read(root / "task_families.yaml")),
        synonyms=SynonymsConfig.model_validate(_read(root / "synonyms.yaml")),
    )

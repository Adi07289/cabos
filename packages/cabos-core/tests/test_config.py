import math
from pathlib import Path

import pytest
import yaml
from pydantic import ValidationError

from cabos_core.config import SafetyConfig, default_config_dir, load_config
from cabos_core.families import task_family


def test_shipped_configs_validate() -> None:
    config = load_config()
    assert config.safety.seatbelt.grace_s == 10
    assert config.safety.seatbelt.alarm_s == 30
    assert config.safety.seatbelt.escalate_s == 60
    assert config.safety.link.lost_after_s == 2.5


@pytest.mark.parametrize(
    ("task_type", "family"),
    [
        ("Earth Excavation", "earthmoving"),
        ("Trenching", "earthmoving"),
        ("Material Loading", "loading"),
        ("Grading", "finishing"),
        ("Demolition", "demolition"),
        ("truck_loading", "loading"),
        ("Site Survey", "unknown"),
    ],
)
def test_task_families(task_type: str, family: str) -> None:
    assert task_family(task_type, load_config().task_families) == family


def test_brief_example_multipliers_are_roughly_respected() -> None:
    # The brief's worked example: "+15% rain, +22% beginner".
    priors = load_config().priors
    assert 1.12 < math.exp(priors.weather["rainy"]) < 1.16
    assert 1.18 < math.exp(priors.operator_skill["beginner"]) < 1.25


def _safety_dict() -> dict[str, object]:
    raw = yaml.safe_load((default_config_dir() / "safety.yaml").read_text())
    assert isinstance(raw, dict)
    return raw


def test_misordered_seatbelt_timings_fail_fast() -> None:
    raw = _safety_dict()
    raw["seatbelt"]["alarm_s"] = 5  # type: ignore[index]
    with pytest.raises(ValidationError, match="grace_s < alarm_s < escalate_s"):
        SafetyConfig.model_validate(raw)


def test_unknown_keys_are_rejected() -> None:
    raw = _safety_dict()
    raw["seatbelt"]["grace_seconds"] = 10  # type: ignore[index]
    with pytest.raises(ValidationError):
        SafetyConfig.model_validate(raw)


def test_yaml_did_not_coerce_yes_no_to_booleans() -> None:
    synonyms = load_config().synonyms
    for aliases in synonyms.categories["seatbelt_status"].values():
        assert all(isinstance(a, str) for a in aliases)
    assert "yes" in synonyms.categories["seatbelt_status"]["fastened"]


def test_config_dir_is_the_repo_config() -> None:
    assert default_config_dir() == Path(__file__).resolve().parents[3] / "config"

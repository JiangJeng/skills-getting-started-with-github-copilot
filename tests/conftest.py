"""Shared pytest fixtures for backend tests."""

import copy

import pytest

from src.app import activities as live_activities


@pytest.fixture(autouse=True)
def reset_activities():
    """Reset the in-memory activities store before and after each test.

    The FastAPI app keeps its "database" as a module-level dict, so tests
    that mutate it (e.g. signing up or removing a participant) must not
    leak state into other tests.
    """
    original_state = copy.deepcopy(live_activities)
    yield
    live_activities.clear()
    live_activities.update(original_state)

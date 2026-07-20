"""Shared constants for trip events and driver duty statuses."""

from enum import StrEnum


class DutyStatus(StrEnum):
    OFF_DUTY = "OFF_DUTY"
    SLEEPER_BERTH = "SLEEPER_BERTH"
    DRIVING = "DRIVING"
    ON_DUTY_NOT_DRIVING = "ON_DUTY_NOT_DRIVING"


class EventType(StrEnum):
    INITIAL_REST = "INITIAL_REST"
    DRIVING = "DRIVING"
    PICKUP = "PICKUP"
    DROPOFF = "DROPOFF"
    FUEL = "FUEL"
    REQUIRED_BREAK = "REQUIRED_BREAK"
    DAILY_REST = "DAILY_REST"
    CYCLE_RESTART = "CYCLE_RESTART"

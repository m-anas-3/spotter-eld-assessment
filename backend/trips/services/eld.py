"""Generate validated, midnight-split daily ELD log sheets."""

from datetime import UTC, date, datetime, time, timedelta
import math
from typing import Any

from trips.constants import DutyStatus
from trips.exceptions import ServiceError
from trips.services.scheduling import format_datetime


MINUTES_PER_DAY = 24 * 60
PROJECTED_LOG_METADATA: dict[str, str | None] = {
    "record_type": "PROJECTED",
    "time_zone": "UTC",
    "period_start": "00:00",
    "driver_name": None,
    "driver_id": None,
    "co_driver_name": None,
    "carrier_name": None,
    "main_office_address": None,
    "tractor_number": None,
    "trailer_number": None,
    "shipping_document_number": None,
    "shipper_name": None,
    "commodity": None,
    "certification_status": "NOT_CERTIFIED",
}
STATUS_TOTAL_KEYS = {
    DutyStatus.OFF_DUTY.value: "off_duty",
    DutyStatus.SLEEPER_BERTH.value: "sleeper_berth",
    DutyStatus.DRIVING.value: "driving",
    DutyStatus.ON_DUTY_NOT_DRIVING.value: "on_duty_not_driving",
}


class TimelineValidationError(ServiceError):
    def __init__(self) -> None:
        super().__init__(
            "INVALID_TIMELINE",
            "The generated trip timeline is invalid.",
            details={},
            status_code=500,
        )


class DailyLogValidationError(ServiceError):
    def __init__(self) -> None:
        super().__init__(
            "INVALID_ELD_DAILY_TOTAL",
            "A generated daily ELD log does not total 24 hours.",
            details={},
            status_code=500,
        )


def generate_daily_logs(
    timeline: list[dict[str, Any]],
    trip_start: datetime,
    trip_completion: datetime,
) -> list[dict[str, Any]]:
    """Create one exact 24-hour ELD sheet for each UTC calendar day touched."""
    if (
        trip_start.tzinfo is None
        or trip_start.utcoffset() is None
        or trip_completion.tzinfo is None
        or trip_completion.utcoffset() is None
    ):
        raise TimelineValidationError()
    normalized_start = trip_start.astimezone(UTC)
    normalized_completion = trip_completion.astimezone(UTC)
    parsed_events = _validate_timeline(
        timeline,
        normalized_start,
        normalized_completion,
    )

    last_touched = normalized_completion - timedelta(microseconds=1)
    logs: list[dict[str, Any]] = []
    current_date = normalized_start.date()
    while current_date <= last_touched.date():
        logs.append(
            _build_daily_log(
                current_date,
                parsed_events,
                normalized_start,
                normalized_completion,
            )
        )
        current_date += timedelta(days=1)
    return logs


def _validate_timeline(
    timeline: list[dict[str, Any]],
    trip_start: datetime,
    trip_completion: datetime,
) -> list[tuple[dict[str, Any], datetime, datetime]]:
    if not timeline or trip_completion <= trip_start:
        raise TimelineValidationError()

    parsed: list[tuple[dict[str, Any], datetime, datetime]] = []
    previous_end: datetime | None = None
    for event in timeline:
        try:
            start = _parse_aware_datetime(event["start_time"])
            end = _parse_aware_datetime(event["end_time"])
            duration = event["duration_minutes"]
            status = event["status"]
        except (KeyError, TypeError):
            raise TimelineValidationError() from None

        distance = event.get("distance_miles")
        invalid_distance = distance is not None and (
            isinstance(distance, bool)
            or not isinstance(distance, (int, float))
            or not math.isfinite(float(distance))
            or float(distance) < 0
        )
        if (
            not isinstance(duration, int)
            or duration <= 0
            or status not in STATUS_TOTAL_KEYS
            or end <= start
            or (end - start).total_seconds() != duration * 60
            or (previous_end is not None and start != previous_end)
            or invalid_distance
        ):
            raise TimelineValidationError()
        parsed.append((event, start, end))
        previous_end = end

    if parsed[0][1] != trip_start or parsed[-1][2] != trip_completion:
        raise TimelineValidationError()
    return parsed


def _build_daily_log(
    log_date: date,
    parsed_events: list[tuple[dict[str, Any], datetime, datetime]],
    trip_start: datetime,
    trip_completion: datetime,
) -> dict[str, Any]:
    day_start = datetime.combine(log_date, time.min, tzinfo=UTC)
    day_end = day_start + timedelta(days=1)
    coverage_start = max(day_start, trip_start)
    coverage_end = min(day_end, trip_completion)
    daily_events: list[dict[str, Any]] = []

    if day_start < coverage_start:
        daily_events.append(
            _fill_event(
                day_start,
                coverage_start,
                "Off duty before trip start",
                day_start,
                parsed_events[0][0].get("location"),
            )
        )

    for event, event_start, event_end in parsed_events:
        piece_start = max(event_start, day_start)
        piece_end = min(event_end, day_end)
        if piece_start < piece_end:
            daily_events.append(
                _event_piece(event, piece_start, piece_end, day_start)
            )

    if coverage_end < day_end:
        daily_events.append(
            _fill_event(
                coverage_end,
                day_end,
                "Off duty after trip completion",
                day_start,
                parsed_events[-1][0].get("location"),
            )
        )

    _validate_daily_coverage(daily_events)
    totals = _status_totals(daily_events)
    return {
        "date": log_date.isoformat(),
        "events": daily_events,
        "status_totals": totals,
        "total_driving_miles": round(
            sum(
                float(event["distance_miles"] or 0)
                for event in daily_events
            ),
            2,
        ),
        "log_metadata": PROJECTED_LOG_METADATA.copy(),
    }


def _event_piece(
    event: dict[str, Any],
    start: datetime,
    end: datetime,
    day_start: datetime,
) -> dict[str, Any]:
    event_duration = event["duration_minutes"]
    piece_duration = int((end - start).total_seconds() // 60)
    distance = event.get("distance_miles")
    piece_distance: float | None = None
    if isinstance(distance, (int, float)) and not isinstance(distance, bool):
        piece_distance = round(float(distance) * piece_duration / event_duration, 4)

    return _daily_event(
        event_type=event["type"],
        status=event["status"],
        start=start,
        end=end,
        day_start=day_start,
        location=event.get("location"),
        description=event.get("description"),
        coordinate=event.get("coordinate"),
        distance_miles=piece_distance,
    )


def _fill_event(
    start: datetime,
    end: datetime,
    description: str,
    day_start: datetime,
    location: str | None,
) -> dict[str, Any]:
    return _daily_event(
        event_type="OFF_DUTY_FILL",
        status=DutyStatus.OFF_DUTY.value,
        start=start,
        end=end,
        day_start=day_start,
        location=location,
        description=description,
        coordinate=None,
        distance_miles=None,
    )


def _daily_event(
    *,
    event_type: str,
    status: str,
    start: datetime,
    end: datetime,
    day_start: datetime,
    location: str | None,
    description: str | None,
    coordinate: list[float] | None,
    distance_miles: float | None,
) -> dict[str, Any]:
    duration_minutes = int((end - start).total_seconds() // 60)
    start_minute = int((start - day_start).total_seconds() // 60)
    end_minute = int((end - day_start).total_seconds() // 60)
    if duration_minutes <= 0:
        raise DailyLogValidationError()
    return {
        "type": event_type,
        "status": status,
        "start_minute": start_minute,
        "end_minute": end_minute,
        "start_time": _display_time(start_minute),
        "end_time": _display_time(end_minute),
        "iso_start_time": format_datetime(start),
        "iso_end_time": format_datetime(end),
        "duration_minutes": duration_minutes,
        "duration_hours": round(duration_minutes / 60, 2),
        "location": location,
        "description": description,
        "coordinate": coordinate,
        "distance_miles": (
            None if distance_miles is None else round(distance_miles, 2)
        ),
    }


def _validate_daily_coverage(events: list[dict[str, Any]]) -> None:
    if not events or events[0]["start_minute"] != 0:
        raise DailyLogValidationError()

    cursor = 0
    for event in events:
        if (
            event["start_minute"] != cursor
            or event["end_minute"] <= event["start_minute"]
            or not 0 <= event["start_minute"] < MINUTES_PER_DAY
            or not 0 < event["end_minute"] <= MINUTES_PER_DAY
        ):
            raise DailyLogValidationError()
        cursor = event["end_minute"]
    if cursor != MINUTES_PER_DAY:
        raise DailyLogValidationError()


def _status_totals(events: list[dict[str, Any]]) -> dict[str, int | float]:
    minutes = {key: 0 for key in STATUS_TOTAL_KEYS.values()}
    for event in events:
        key = STATUS_TOTAL_KEYS.get(event["status"])
        if key is None:
            raise DailyLogValidationError()
        minutes[key] += event["duration_minutes"]

    if sum(minutes.values()) != MINUTES_PER_DAY:
        raise DailyLogValidationError()

    totals: dict[str, int | float] = {}
    for key, value in minutes.items():
        totals[f"{key}_minutes"] = value
    for key, value in minutes.items():
        totals[f"{key}_hours"] = round(value / 60, 2)
    totals["total_minutes"] = sum(minutes.values())
    totals["total_hours"] = round(totals["total_minutes"] / 60, 2)
    on_duty_minutes = minutes["driving"] + minutes["on_duty_not_driving"]
    totals["total_on_duty_minutes"] = on_duty_minutes
    totals["total_on_duty_hours"] = round(on_duty_minutes / 60, 2)
    return totals


def _parse_aware_datetime(value: object) -> datetime:
    if not isinstance(value, str):
        raise TimelineValidationError()
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        raise TimelineValidationError() from None
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise TimelineValidationError()
    return parsed.astimezone(UTC)


def _display_time(minute: int) -> str:
    if minute == MINUTES_PER_DAY:
        return "24:00"
    hours, minutes = divmod(minute, 60)
    return f"{hours:02d}:{minutes:02d}"

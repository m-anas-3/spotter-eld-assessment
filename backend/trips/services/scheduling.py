"""Deterministic Hours-of-Service scheduling using integer minutes."""

import math
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from trips.constants import DutyStatus, EventType
from trips.exceptions import ServiceError
from trips.services.geometry import interpolate_route_coordinate
from trips.services.routing import RouteLeg, RouteResult


MAX_DAILY_DRIVING_MINUTES = 11 * 60
WORK_WINDOW_MINUTES = 14 * 60
BREAK_DRIVING_MINUTES = 8 * 60
CYCLE_LIMIT_MINUTES = 70 * 60
PRE_TRIP_INSPECTION_MINUTES = 30
PICKUP_MINUTES = 60
DROPOFF_MINUTES = 60
POST_TRIP_INSPECTION_MINUTES = 30
FUEL_MINUTES = 30
REQUIRED_BREAK_MINUTES = 30
DAILY_REST_MINUTES = 10 * 60
CYCLE_RESTART_MINUTES = 34 * 60
FUEL_INTERVAL_MILES = 1_000
EPSILON = 1e-7


@dataclass(frozen=True, slots=True)
class ScheduleResult:
    timeline: list[dict[str, Any]]
    stops: list[dict[str, Any]]
    final_cycle_used_minutes: int


class HOSScheduler:
    """Schedule route legs and fixed work while enforcing assessment HOS rules."""

    def __init__(
        self,
        route: RouteResult,
        *,
        start_time: datetime,
        initial_cycle_used_minutes: int,
    ) -> None:
        self.route = route
        self.current_time = start_time
        self.initial_start_time = start_time
        self.cycle_used_minutes = initial_cycle_used_minutes
        self.daily_driving_minutes = 0
        self.break_driving_minutes = 0
        self.shift_start: datetime | None = None
        self.route_distance_completed = 0.0
        self.timeline: list[dict[str, Any]] = []
        self.stops: list[dict[str, Any]] = []
        self.stop_counts: dict[str, int] = {}
        self.fuel_thresholds = self._build_fuel_thresholds()
        self.next_fuel_index = 0
        self._iterations = 0

    def schedule(self) -> ScheduleResult:
        if len(self.route.legs) != 2:
            raise ServiceError(
                "SCHEDULING_ERROR",
                "The trip route could not be scheduled.",
                status_code=500,
            )

        self._add_location_stop(
            stop_id="current",
            stop_type="CURRENT",
            label=self.route.legs[0].start_label,
            coordinate=self.route.geometry[0],
            arrival=self.current_time,
            departure=self.current_time,
            duration_minutes=0,
            location=self.route.legs[0].start_label,
        )

        self._add_fixed_activity(
            EventType.PRE_TRIP_INSPECTION,
            PRE_TRIP_INSPECTION_MINUTES,
            self.route.legs[0].start_label,
            self.route.geometry[0],
            "Pre-trip vehicle inspection",
            include_stop=False,
        )

        self._drive_leg(
            self.route.legs[0],
            description="Driving toward pickup location",
        )
        self._add_fixed_activity(
            EventType.PICKUP,
            PICKUP_MINUTES,
            self.route.legs[0].end_label,
            self.route.legs[0].geometry[-1],
            "Loading at pickup location",
        )

        self._drive_leg(
            self.route.legs[1],
            description="Driving toward drop-off location",
        )
        self._add_fixed_activity(
            EventType.DROPOFF,
            DROPOFF_MINUTES,
            self.route.legs[1].end_label,
            self.route.legs[1].geometry[-1],
            "Unloading at drop-off location",
        )
        self._add_fixed_activity(
            EventType.POST_TRIP_INSPECTION,
            POST_TRIP_INSPECTION_MINUTES,
            self.route.legs[1].end_label,
            self.route.legs[1].geometry[-1],
            "Post-trip vehicle inspection",
            include_stop=False,
        )

        return ScheduleResult(
            timeline=self.timeline,
            stops=self.stops,
            final_cycle_used_minutes=self.cycle_used_minutes,
        )

    def _drive_leg(self, leg: RouteLeg, *, description: str) -> None:
        remaining_minutes = leg.duration_minutes
        remaining_distance = leg.distance_miles

        while remaining_minutes > 0:
            self._iterations += 1
            if self._iterations > 10_000:
                raise ServiceError(
                    "SCHEDULING_ERROR",
                    "The trip route could not be scheduled.",
                    status_code=500,
                )

            self._prepare_to_drive(leg.end_label)

            fuel_minutes = self._minutes_to_fuel(
                remaining_minutes,
                remaining_distance,
            )
            candidates = [
                remaining_minutes,
                MAX_DAILY_DRIVING_MINUTES - self.daily_driving_minutes,
                self._window_remaining_minutes(),
                CYCLE_LIMIT_MINUTES - self.cycle_used_minutes,
                BREAK_DRIVING_MINUTES - self.break_driving_minutes,
            ]
            if fuel_minutes is not None:
                candidates.append(fuel_minutes)
            chunk_minutes = min(candidates)
            if chunk_minutes <= 0:
                # All zero constraints are consumed by _prepare_to_drive.
                raise ServiceError(
                    "SCHEDULING_ERROR",
                    "The trip route could not be scheduled.",
                    status_code=500,
                )

            fuel_due = fuel_minutes is not None and chunk_minutes == fuel_minutes
            if chunk_minutes == remaining_minutes:
                chunk_distance = remaining_distance
            elif fuel_due:
                chunk_distance = (
                    self.fuel_thresholds[self.next_fuel_index]
                    - self.route_distance_completed
                )
            else:
                chunk_distance = (
                    remaining_distance * chunk_minutes / remaining_minutes
                )

            start_coordinate = self._current_coordinate()
            self.route_distance_completed += chunk_distance
            remaining_minutes -= chunk_minutes
            remaining_distance = max(0.0, remaining_distance - chunk_distance)
            self._add_event(
                event_type=EventType.DRIVING,
                status=DutyStatus.DRIVING,
                duration_minutes=chunk_minutes,
                location=f"Between {leg.start_label} and {leg.end_label}",
                coordinate=start_coordinate,
                distance_miles=chunk_distance,
                description=description,
                counts_cycle=True,
                begins_shift=True,
            )
            self.daily_driving_minutes += chunk_minutes
            self.break_driving_minutes += chunk_minutes

            if fuel_due:
                self._add_fuel_stop(leg.end_label)
                self.next_fuel_index += 1

    def _prepare_to_drive(self, destination_label: str) -> None:
        if self.cycle_used_minutes >= CYCLE_LIMIT_MINUTES:
            self._add_rest(
                event_type=EventType.CYCLE_RESTART,
                status=DutyStatus.OFF_DUTY,
                duration_minutes=CYCLE_RESTART_MINUTES,
                location=f"Along route to {destination_label}",
                description="34-hour cycle restart",
            )
            self.cycle_used_minutes = 0
            self._reset_daily_limits()
            return

        if (
            self.daily_driving_minutes >= MAX_DAILY_DRIVING_MINUTES
            or self._window_remaining_minutes() <= 0
        ):
            self._add_rest(
                event_type=EventType.DAILY_REST,
                status=DutyStatus.SLEEPER_BERTH,
                duration_minutes=DAILY_REST_MINUTES,
                location=f"Along route to {destination_label}",
                description="10-hour sleeper-berth rest",
            )
            self._reset_daily_limits()
            return

        if self.break_driving_minutes >= BREAK_DRIVING_MINUTES:
            self._add_rest(
                event_type=EventType.REQUIRED_BREAK,
                status=DutyStatus.OFF_DUTY,
                duration_minutes=REQUIRED_BREAK_MINUTES,
                location=f"Along route to {destination_label}",
                description="Required 30-minute non-driving break",
            )
            self.break_driving_minutes = 0

    def _add_fixed_activity(
        self,
        event_type: EventType,
        duration_minutes: int,
        label: str,
        coordinate: list[float],
        description: str,
        *,
        include_stop: bool = True,
    ) -> None:
        start = self.current_time
        self._add_event(
            event_type=event_type,
            status=DutyStatus.ON_DUTY_NOT_DRIVING,
            duration_minutes=duration_minutes,
            location=label,
            coordinate=coordinate,
            distance_miles=None,
            description=description,
            counts_cycle=True,
            begins_shift=True,
        )
        self.break_driving_minutes = 0
        if include_stop:
            self._add_location_stop(
                stop_id=event_type.value.lower(),
                stop_type=event_type.value,
                label=label,
                coordinate=coordinate,
                arrival=start,
                departure=self.current_time,
                duration_minutes=duration_minutes,
                location=label,
            )

    def _add_fuel_stop(self, destination_label: str) -> None:
        coordinate = self._current_coordinate()
        start = self.current_time
        number = self.stop_counts.get(EventType.FUEL.value, 0) + 1
        self._add_event(
            event_type=EventType.FUEL,
            status=DutyStatus.ON_DUTY_NOT_DRIVING,
            duration_minutes=FUEL_MINUTES,
            location=f"Along route to {destination_label}",
            coordinate=coordinate,
            distance_miles=None,
            description=f"Fuel stop {number}",
            counts_cycle=True,
            begins_shift=True,
        )
        self.break_driving_minutes = 0
        self._add_location_stop(
            stop_id=f"fuel-{number}",
            stop_type=EventType.FUEL.value,
            label=f"Fuel stop {number}",
            coordinate=coordinate,
            arrival=start,
            departure=self.current_time,
            duration_minutes=FUEL_MINUTES,
            location=f"Along route to {destination_label}",
        )

    def _add_rest(
        self,
        *,
        event_type: EventType,
        status: DutyStatus,
        duration_minutes: int,
        location: str,
        description: str,
    ) -> None:
        coordinate = self._current_coordinate()
        start = self.current_time
        number = self.stop_counts.get(event_type.value, 0) + 1
        self._add_event(
            event_type=event_type,
            status=status,
            duration_minutes=duration_minutes,
            location=location,
            coordinate=coordinate,
            distance_miles=None,
            description=description,
            counts_cycle=False,
            begins_shift=False,
        )
        self._add_location_stop(
            stop_id=f"{event_type.value.lower().replace('_', '-')}-{number}",
            stop_type=event_type.value,
            label=description,
            coordinate=coordinate,
            arrival=start,
            departure=self.current_time,
            duration_minutes=duration_minutes,
            location=location,
        )

    def _add_event(
        self,
        *,
        event_type: EventType,
        status: DutyStatus,
        duration_minutes: int,
        location: str,
        coordinate: list[float] | None,
        distance_miles: float | None,
        description: str,
        counts_cycle: bool,
        begins_shift: bool,
    ) -> None:
        if duration_minutes <= 0:
            raise ServiceError(
                "SCHEDULING_ERROR",
                "The trip route could not be scheduled.",
                status_code=500,
            )
        if begins_shift and self.shift_start is None:
            self.shift_start = self.current_time

        start = self.current_time
        end = start + timedelta(minutes=duration_minutes)
        self.timeline.append(
            {
                "type": event_type.value,
                "status": status.value,
                "start_time": format_datetime(start),
                "end_time": format_datetime(end),
                "duration_minutes": duration_minutes,
                "duration_hours": round(duration_minutes / 60, 2),
                "location": location,
                "coordinate": _rounded_coordinate(coordinate),
                "distance_miles": (
                    None
                    if distance_miles is None
                    else round(distance_miles, 2)
                ),
                "description": description,
            }
        )
        self.current_time = end
        if counts_cycle:
            self.cycle_used_minutes += duration_minutes

    def _add_location_stop(
        self,
        *,
        stop_id: str,
        stop_type: str,
        label: str,
        coordinate: list[float],
        arrival: datetime,
        departure: datetime,
        duration_minutes: int,
        location: str,
    ) -> None:
        self.stop_counts[stop_type] = self.stop_counts.get(stop_type, 0) + 1
        self.stops.append(
            {
                "id": stop_id,
                "type": stop_type,
                "label": label,
                "coordinate": _rounded_coordinate(coordinate),
                "arrival_time": format_datetime(arrival),
                "departure_time": format_datetime(departure),
                "duration_minutes": duration_minutes,
                "location": location,
            }
        )

    def _window_remaining_minutes(self) -> int:
        if self.shift_start is None:
            return WORK_WINDOW_MINUTES
        elapsed = int(
            (self.current_time - self.shift_start).total_seconds() // 60
        )
        return WORK_WINDOW_MINUTES - elapsed

    def _minutes_to_fuel(
        self,
        remaining_minutes: int,
        remaining_distance: float,
    ) -> int | None:
        if self.next_fuel_index >= len(self.fuel_thresholds):
            return None
        target = self.fuel_thresholds[self.next_fuel_index]
        distance_to_target = target - self.route_distance_completed
        if (
            distance_to_target <= EPSILON
            or distance_to_target > remaining_distance + EPSILON
        ):
            return None
        if remaining_minutes == 1:
            return 1
        proportional_minutes = round(
            remaining_minutes * distance_to_target / remaining_distance
        )
        return max(1, min(remaining_minutes - 1, proportional_minutes))

    def _current_coordinate(self) -> list[float]:
        coordinate = interpolate_route_coordinate(
            self.route.geometry,
            self.route_distance_completed,
            self.route.distance_miles,
        )
        if coordinate is None:
            raise ServiceError(
                "SCHEDULING_ERROR",
                "The trip route could not be scheduled.",
                status_code=500,
            )
        return coordinate

    def _build_fuel_thresholds(self) -> list[float]:
        count = max(
            0,
            math.ceil(self.route.distance_miles / FUEL_INTERVAL_MILES) - 1,
        )
        return [
            float(index * FUEL_INTERVAL_MILES)
            for index in range(1, count + 1)
        ]

    def _reset_daily_limits(self) -> None:
        self.daily_driving_minutes = 0
        self.break_driving_minutes = 0
        self.shift_start = None


def format_datetime(value: datetime) -> str:
    """Serialize an aware datetime in UTC with an explicit Z suffix."""
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _rounded_coordinate(
    coordinate: list[float] | None,
) -> list[float] | None:
    if coordinate is None:
        return None
    return [round(coordinate[0], 6), round(coordinate[1], 6)]

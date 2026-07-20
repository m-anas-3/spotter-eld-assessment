"""Orchestrate routing, HOS scheduling, ELD logs, and response assembly."""

from datetime import datetime
from typing import Any

from django.utils import timezone

from trips.services.eld import generate_daily_logs
from trips.services.geometry import as_coordinate
from trips.services.openrouteservice import OpenRouteServiceProvider
from trips.services.routing import Coordinate, RouteResult, RoutingProvider
from trips.services.scheduling import HOSScheduler


ASSUMPTIONS = [
    "Property-carrying driver using the 70-hour/8-day cycle.",
    "The driver starts after completing ten consecutive hours off duty.",
    "Pickup and drop-off each take one hour.",
    "Fueling takes 30 minutes.",
    "Fueling is required at least once every 1,000 miles.",
    (
        "A 34-hour restart is used when additional driving is required after "
        "reaching the cycle limit."
    ),
    (
        "The cycle-restart calculation is simplified because the previous "
        "eight days of driver logs are not provided."
    ),
]


def resolve_start_time(start_time: datetime | None = None) -> datetime:
    """Use the provided start or the current UTC quarter-hour."""
    if start_time is not None:
        return start_time

    current_time = timezone.now()
    rounded_minute = current_time.minute - (current_time.minute % 15)
    return current_time.replace(
        minute=rounded_minute,
        second=0,
        microsecond=0,
    )


def calculate_trip(
    *,
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    current_cycle_used_hours: float,
    start_time: datetime | None = None,
    provider: RoutingProvider | None = None,
) -> dict[str, Any]:
    """Calculate an ordered route and its deterministic HOS schedule."""
    owns_provider = provider is None
    routing_provider = provider or OpenRouteServiceProvider()
    labels = [current_location, pickup_location, dropoff_location]

    try:
        coordinates = [
            routing_provider.geocode(label)
            for label in labels
        ]
        route = routing_provider.get_route(coordinates, labels)
    finally:
        if owns_provider and isinstance(
            routing_provider,
            OpenRouteServiceProvider,
        ):
            routing_provider.close()

    effective_start = resolve_start_time(start_time)
    initial_cycle_minutes = round(current_cycle_used_hours * 60)
    schedule = HOSScheduler(
        route,
        start_time=effective_start,
        initial_cycle_used_minutes=initial_cycle_minutes,
    ).schedule()

    total_trip_minutes = int(
        (
            _parse_last_end(schedule.timeline) - effective_start
        ).total_seconds()
        // 60
    )
    trip_completion = _parse_last_end(schedule.timeline)
    daily_logs = generate_daily_logs(
        schedule.timeline,
        effective_start,
        trip_completion,
    )
    fuel_count = sum(
        stop["type"] == "FUEL" for stop in schedule.stops
    )

    return {
        "trip_summary": {
            "total_distance_miles": round(route.distance_miles, 2),
            "estimated_driving_hours": round(route.duration_minutes / 60, 2),
            "total_trip_hours": round(total_trip_minutes / 60, 2),
            "total_trip_days": len(daily_logs),
            "fuel_stop_count": fuel_count,
            "initial_cycle_used_hours": current_cycle_used_hours,
            "final_cycle_used_hours": round(
                schedule.final_cycle_used_minutes / 60,
                2,
            ),
        },
        "locations": {
            "current": _location_response(labels[0], coordinates[0]),
            "pickup": _location_response(labels[1], coordinates[1]),
            "dropoff": _location_response(labels[2], coordinates[2]),
        },
        "route": _route_response(route),
        "route_legs": _route_legs_response(route),
        "stops": schedule.stops,
        "timeline": schedule.timeline,
        "daily_logs": daily_logs,
        "assumptions": ASSUMPTIONS,
    }


def _location_response(label: str, coordinate: Coordinate) -> dict[str, Any]:
    return {
        "label": label,
        "coordinate": as_coordinate(coordinate),
    }


def _route_response(route: RouteResult) -> dict[str, Any]:
    return {
        "type": "LineString",
        "coordinates": route.geometry,
    }


def _route_legs_response(route: RouteResult) -> list[dict[str, Any]]:
    return [
        {
            "start_label": leg.start_label,
            "end_label": leg.end_label,
            "distance_miles": round(leg.distance_miles, 2),
            "duration_minutes": leg.duration_minutes,
            "geometry": leg.geometry,
            "instructions": [
                {
                    "instruction": instruction.instruction,
                    "distance_miles": instruction.distance_miles,
                    "duration_minutes": instruction.duration_minutes,
                    "coordinate": instruction.coordinate,
                }
                for instruction in leg.instructions
            ],
        }
        for leg in route.legs
    ]


def _parse_last_end(timeline: list[dict[str, Any]]) -> datetime:
    return datetime.fromisoformat(timeline[-1]["end_time"].replace("Z", "+00:00"))

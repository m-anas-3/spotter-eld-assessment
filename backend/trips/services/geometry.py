"""Polyline interpolation helpers for route-position markers."""

import math

from trips.services.routing import Coordinate


def interpolate_route_coordinate(
    geometry: list[list[float]],
    distance_miles: float,
    total_distance_miles: float,
) -> list[float] | None:
    """Interpolate by progress over a polyline, preserving lon/lat order."""
    if not geometry:
        return None
    if len(geometry) == 1 or total_distance_miles <= 0:
        return list(geometry[0])

    fraction = min(1.0, max(0.0, distance_miles / total_distance_miles))
    segment_lengths = [
        _planar_length(geometry[index], geometry[index + 1])
        for index in range(len(geometry) - 1)
    ]
    total_geometry_length = sum(segment_lengths)
    if total_geometry_length <= 0:
        return list(geometry[0])

    target = fraction * total_geometry_length
    traversed = 0.0
    for index, segment_length in enumerate(segment_lengths):
        if target <= traversed + segment_length or index == len(segment_lengths) - 1:
            segment_fraction = (
                0.0
                if segment_length == 0
                else (target - traversed) / segment_length
            )
            start = geometry[index]
            end = geometry[index + 1]
            return [
                start[0] + (end[0] - start[0]) * segment_fraction,
                start[1] + (end[1] - start[1]) * segment_fraction,
            ]
        traversed += segment_length
    return list(geometry[-1])


def as_coordinate(value: Coordinate) -> list[float]:
    return [value[0], value[1]]


def _planar_length(start: list[float], end: list[float]) -> float:
    return math.hypot(end[0] - start[0], end[1] - start[1])

"""Typed routing-provider contracts and results."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import TypeAlias


Coordinate: TypeAlias = tuple[float, float]


@dataclass(frozen=True, slots=True)
class RouteInstruction:
    instruction: str
    distance_miles: float
    duration_minutes: float
    coordinate: list[float] | None = None


@dataclass(frozen=True, slots=True)
class RouteLeg:
    start_label: str
    end_label: str
    distance_miles: float
    duration_minutes: int
    geometry: list[list[float]]
    instructions: list[RouteInstruction] = field(default_factory=list)


@dataclass(frozen=True, slots=True)
class RouteResult:
    legs: list[RouteLeg]
    distance_miles: float
    duration_minutes: int
    geometry: list[list[float]]


class RoutingProvider(ABC):
    """Provider-neutral interface used by trip calculation."""

    @abstractmethod
    def geocode(self, address: str) -> Coordinate:
        """Return a coordinate in longitude, latitude order."""

    @abstractmethod
    def get_route(
        self,
        coordinates: list[Coordinate],
        labels: list[str] | None = None,
    ) -> RouteResult:
        """Calculate ordered route legs through every coordinate."""

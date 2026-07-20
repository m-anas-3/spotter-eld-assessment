"""OpenRouteService implementation of the routing provider contract."""

import logging
import math
import os
from typing import Any

import httpx

from trips.exceptions import ServiceError
from trips.services.routing import Coordinate, RouteLeg, RouteResult, RoutingProvider


METERS_TO_MILES = 0.000621371192
GEOCODE_URL = "https://api.heigit.org/pelias/v1/search"
DIRECTIONS_URL = (
    "https://api.heigit.org/openrouteservice/v2/"
    "directions/driving-hgv/geojson"
)
logger = logging.getLogger(__name__)


class RoutingProviderError(ServiceError):
    """A sanitized error for all failures originating at the route provider."""

    def __init__(self, *, status_code: int = 503) -> None:
        super().__init__(
            "ROUTING_PROVIDER_ERROR",
            "Unable to calculate the route right now.",
            details={},
            status_code=status_code,
        )


class OpenRouteServiceProvider(RoutingProvider):
    """Synchronous OpenRouteService client with provider response validation."""

    def __init__(
        self,
        api_key: str | None = None,
        *,
        client: httpx.Client | None = None,
        timeout_seconds: float = 15.0,
    ) -> None:
        self.api_key = api_key or os.getenv("OPENROUTESERVICE_API_KEY", "")
        if not self.api_key:
            raise RoutingProviderError()
        self._owns_client = client is None
        self.client = client or httpx.Client(timeout=timeout_seconds)

    def close(self) -> None:
        if self._owns_client:
            self.client.close()

    def geocode(self, address: str) -> Coordinate:
        response = self._request(
            "GET",
            GEOCODE_URL,
            params={
                "api_key": self.api_key,
                "text": address,
                "size": 1,
            },
        )
        payload = self._json_object(response)
        try:
            features = payload["features"]
            if not isinstance(features, list) or not features:
                raise RoutingProviderError(status_code=400)
            raw_coordinate = features[0]["geometry"]["coordinates"]
            coordinate = self._validate_coordinate(raw_coordinate)
        except RoutingProviderError:
            raise
        except (KeyError, TypeError, IndexError):
            raise RoutingProviderError() from None
        return coordinate

    def get_route(
        self,
        coordinates: list[Coordinate],
        labels: list[str] | None = None,
    ) -> RouteResult:
        if len(coordinates) < 2:
            raise ValueError("At least two coordinates are required.")
        if labels is not None and len(labels) != len(coordinates):
            raise ValueError("Labels must correspond to route coordinates.")

        route_labels = labels or [
            f"Waypoint {index + 1}" for index in range(len(coordinates))
        ]
        legs = [
            self._get_leg(
                coordinates[index],
                coordinates[index + 1],
                route_labels[index],
                route_labels[index + 1],
            )
            for index in range(len(coordinates) - 1)
        ]
        geometry = self._combine_geometry(legs)
        return RouteResult(
            legs=legs,
            distance_miles=sum(leg.distance_miles for leg in legs),
            duration_minutes=sum(leg.duration_minutes for leg in legs),
            geometry=geometry,
        )

    def _get_leg(
        self,
        start: Coordinate,
        end: Coordinate,
        start_label: str,
        end_label: str,
    ) -> RouteLeg:
        response = self._request(
            "POST",
            DIRECTIONS_URL,
            headers={
                "Authorization": self.api_key,
                "Content-Type": "application/json",
            },
            json={"coordinates": [list(start), list(end)]},
        )
        payload = self._json_object(response)
        try:
            features = payload["features"]
            if not isinstance(features, list) or not features:
                raise RoutingProviderError(status_code=422)
            feature = features[0]
            summary = feature["properties"]["summary"]
            geometry_object = feature["geometry"]
            if geometry_object["type"] != "LineString":
                raise RoutingProviderError()
            geometry = [
                list(self._validate_coordinate(coordinate))
                for coordinate in geometry_object["coordinates"]
            ]
            if len(geometry) < 2:
                raise RoutingProviderError()
            distance_miles = float(summary["distance"]) * METERS_TO_MILES
            duration_minutes = max(1, round(float(summary["duration"]) / 60))
            if not math.isfinite(distance_miles) or distance_miles <= 0:
                raise RoutingProviderError()
        except RoutingProviderError:
            raise
        except (KeyError, TypeError, ValueError, IndexError):
            raise RoutingProviderError() from None

        return RouteLeg(
            start_label=start_label,
            end_label=end_label,
            distance_miles=distance_miles,
            duration_minutes=duration_minutes,
            geometry=geometry,
        )

    def _request(self, method: str, url: str, **kwargs: Any) -> httpx.Response:
        try:
            response = self.client.request(method, url, **kwargs)
        except httpx.TimeoutException:
            logger.warning(
                "OpenRouteService request timed out: method=%s endpoint=%s",
                method,
                url,
            )
            raise RoutingProviderError() from None
        except httpx.HTTPError:
            logger.warning(
                "OpenRouteService connection failed: method=%s endpoint=%s",
                method,
                url,
            )
            raise RoutingProviderError() from None

        if response.status_code == 429:
            logger.warning(
                "OpenRouteService rate limit reached: endpoint=%s",
                url,
            )
            raise RoutingProviderError(status_code=503)
        if response.is_error:
            logger.warning(
                "OpenRouteService returned HTTP %s: endpoint=%s",
                response.status_code,
                url,
            )
            raise RoutingProviderError()
        return response

    @staticmethod
    def _json_object(response: httpx.Response) -> dict[str, Any]:
        try:
            payload = response.json()
        except (ValueError, TypeError):
            raise RoutingProviderError() from None
        if not isinstance(payload, dict):
            raise RoutingProviderError()
        return payload

    @staticmethod
    def _validate_coordinate(value: object) -> Coordinate:
        if not isinstance(value, (list, tuple)) or len(value) < 2:
            raise RoutingProviderError()
        try:
            longitude = float(value[0])
            latitude = float(value[1])
        except (TypeError, ValueError):
            raise RoutingProviderError() from None
        if not (
            math.isfinite(longitude)
            and math.isfinite(latitude)
            and -180 <= longitude <= 180
            and -90 <= latitude <= 90
        ):
            raise RoutingProviderError()
        return longitude, latitude

    @staticmethod
    def _combine_geometry(legs: list[RouteLeg]) -> list[list[float]]:
        geometry: list[list[float]] = []
        for leg in legs:
            if geometry and geometry[-1] == leg.geometry[0]:
                geometry.extend(leg.geometry[1:])
            else:
                geometry.extend(leg.geometry)
        return geometry

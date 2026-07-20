import os
from unittest.mock import Mock
from unittest.mock import patch

import httpx
from django.test import SimpleTestCase

from trips.services.openrouteservice import (
    DIRECTIONS_URL,
    GEOCODE_URL,
    OpenRouteServiceProvider,
    RoutingProviderError,
)


def json_response(status_code: int, payload: object) -> httpx.Response:
    request = httpx.Request("GET", "https://routing.test")
    return httpx.Response(status_code, json=payload, request=request)


def route_payload(
    *,
    coordinates: list[list[float]] | None = None,
) -> dict[str, object]:
    return {
        "features": [
            {
                "properties": {
                    "summary": {
                        "distance": 160_934.4,
                        "duration": 7_200,
                    },
                    "segments": [
                        {
                            "steps": [
                                {
                                    "instruction": "Head north",
                                    "distance": 1_609.344,
                                    "duration": 120,
                                    "way_points": [0, 1],
                                }
                            ]
                        }
                    ],
                },
                "geometry": {
                    "type": "LineString",
                    "coordinates": coordinates
                    or [[-87.6298, 41.8781], [-88.0, 42.2]],
                },
            }
        ]
    }


class OpenRouteServiceProviderTests(SimpleTestCase):
    def setUp(self) -> None:
        self.client = Mock(spec=httpx.Client)
        self.provider = OpenRouteServiceProvider(
            api_key="test-api-key",
            client=self.client,
        )

    def test_geocoding_success(self) -> None:
        self.client.request.return_value = json_response(
            200,
            {
                "features": [
                    {
                        "geometry": {
                            "coordinates": [-87.6298, 41.8781],
                        }
                    }
                ]
            },
        )

        coordinate = self.provider.geocode("Chicago, IL")

        self.assertEqual(coordinate, (-87.6298, 41.8781))

    def test_current_heigit_api_endpoints_are_used(self) -> None:
        self.assertEqual(
            GEOCODE_URL,
            "https://api.heigit.org/pelias/v1/search",
        )
        self.assertEqual(
            DIRECTIONS_URL,
            (
                "https://api.heigit.org/openrouteservice/v2/"
                "directions/driving-hgv/geojson"
            ),
        )

    def test_missing_api_key_is_handled(self) -> None:
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(RoutingProviderError) as context:
                OpenRouteServiceProvider()

        self.assertEqual(context.exception.code, "ROUTING_PROVIDER_ERROR")

    def test_address_not_found(self) -> None:
        self.client.request.return_value = json_response(
            200,
            {"features": []},
        )

        with self.assertRaises(RoutingProviderError) as context:
            self.provider.geocode("Missing place")

        self.assertEqual(context.exception.code, "ROUTING_PROVIDER_ERROR")
        self.assertEqual(context.exception.status_code, 400)

    def test_route_provider_timeout(self) -> None:
        request = httpx.Request("GET", "https://routing.test")
        self.client.request.side_effect = httpx.ReadTimeout(
            "timed out",
            request=request,
        )

        with self.assertRaises(RoutingProviderError):
            self.provider.geocode("Chicago, IL")

    def test_route_provider_rate_limit(self) -> None:
        self.client.request.return_value = json_response(429, {})

        with self.assertRaises(RoutingProviderError) as context:
            self.provider.geocode("Chicago, IL")

        self.assertEqual(context.exception.status_code, 503)

    def test_coordinates_are_longitude_then_latitude(self) -> None:
        self.client.request.return_value = json_response(
            200,
            route_payload(
                coordinates=[
                    [-87.6298, 41.8781],
                    [-88.1234, 42.5678],
                ]
            ),
        )

        result = self.provider.get_route(
            [(-87.6298, 41.8781), (-88.1234, 42.5678)],
            ["Chicago", "Milwaukee"],
        )

        request_kwargs = self.client.request.call_args.kwargs
        self.assertEqual(
            request_kwargs["json"]["coordinates"],
            [[-87.6298, 41.8781], [-88.1234, 42.5678]],
        )
        self.assertEqual(result.geometry[0], [-87.6298, 41.8781])
        self.assertEqual(result.geometry[-1], [-88.1234, 42.5678])

    def test_route_instructions_are_preserved(self) -> None:
        self.client.request.return_value = json_response(200, route_payload())

        result = self.provider.get_route(
            [(-87.6298, 41.8781), (-88.0, 42.2)],
            ["Chicago", "Milwaukee"],
        )

        instruction = result.legs[0].instructions[0]
        self.assertEqual(instruction.instruction, "Head north")
        self.assertEqual(instruction.distance_miles, 1.0)
        self.assertEqual(instruction.duration_minutes, 2.0)
        self.assertEqual(instruction.coordinate, [-87.6298, 41.8781])

from datetime import UTC, datetime
from unittest.mock import patch

from django.test import SimpleTestCase

from trips.services.routing import (
    Coordinate,
    RouteInstruction,
    RouteLeg,
    RouteResult,
    RoutingProvider,
)
from trips.services.trip_calculator import calculate_trip


class FakeRoutingProvider(RoutingProvider):
    def __init__(self) -> None:
        self.geocoded: list[str] = []
        self.route_coordinates: list[Coordinate] = []
        self.route_labels: list[str] = []
        self.coordinates = {
            "Current": (-90.0, 40.0),
            "Pickup": (-89.0, 41.0),
            "Drop-off": (-88.0, 42.0),
        }

    def geocode(self, address: str) -> Coordinate:
        self.geocoded.append(address)
        return self.coordinates[address]

    def get_route(
        self,
        coordinates: list[Coordinate],
        labels: list[str] | None = None,
    ) -> RouteResult:
        self.route_coordinates = coordinates
        self.route_labels = labels or []
        legs = [
            RouteLeg(
                start_label="Current",
                end_label="Pickup",
                distance_miles=100,
                duration_minutes=120,
                geometry=[[-90.0, 40.0], [-89.0, 41.0]],
                instructions=[
                    RouteInstruction(
                        instruction="Continue toward pickup",
                        distance_miles=100,
                        duration_minutes=120,
                        coordinate=[-90.0, 40.0],
                    )
                ],
            ),
            RouteLeg(
                start_label="Pickup",
                end_label="Drop-off",
                distance_miles=200,
                duration_minutes=240,
                geometry=[[-89.0, 41.0], [-88.0, 42.0]],
            ),
        ]
        return RouteResult(
            legs=legs,
            distance_miles=300,
            duration_minutes=360,
            geometry=[[-90.0, 40.0], [-89.0, 41.0], [-88.0, 42.0]],
        )


class TripCalculatorTests(SimpleTestCase):
    def test_calculation_preserves_location_order_and_response_contract(self) -> None:
        provider = FakeRoutingProvider()

        result = calculate_trip(
            current_location="Current",
            pickup_location="Pickup",
            dropoff_location="Drop-off",
            current_cycle_used_hours=20,
            start_time=datetime(2026, 7, 21, 8, tzinfo=UTC),
            provider=provider,
        )

        self.assertEqual(provider.geocoded, ["Current", "Pickup", "Drop-off"])
        self.assertEqual(
            provider.route_coordinates,
            [(-90.0, 40.0), (-89.0, 41.0), (-88.0, 42.0)],
        )
        self.assertEqual(
            provider.route_labels,
            ["Current", "Pickup", "Drop-off"],
        )
        self.assertEqual(
            result["locations"]["current"]["coordinate"],
            [-90.0, 40.0],
        )
        self.assertEqual(result["route"]["type"], "LineString")
        self.assertEqual(len(result["route_legs"]), 2)
        self.assertNotIn("geometry", result["route_legs"][0])
        self.assertEqual(
            result["route_legs"][0]["instructions"][0]["instruction"],
            "Continue toward pickup",
        )
        self.assertTrue(result["daily_logs"])
        self.assertEqual(
            sum(log["total_driving_miles"] for log in result["daily_logs"]),
            300,
        )
        self.assertTrue(
            all(
                log["log_metadata"]["record_type"] == "PROJECTED"
                for log in result["daily_logs"]
            )
        )
        self.assertEqual(result["timeline"][0]["location"], "Current")
        self.assertTrue(
            all("location" in stop for stop in result["stops"])
        )
        self.assertTrue(
            all(
                log["status_totals"]["total_minutes"] == 1_440
                and log["status_totals"]["total_hours"] == 24
                for log in result["daily_logs"]
            )
        )
        self.assertTrue(
            all(
                event["start_time"].endswith("Z")
                and event["end_time"].endswith("Z")
                for event in result["timeline"]
            )
        )

    def test_complete_response_is_geojson_and_maplibre_compatible(self) -> None:
        result = calculate_trip(
            current_location="Current",
            pickup_location="Pickup",
            dropoff_location="Drop-off",
            current_cycle_used_hours=20,
            start_time=datetime(2026, 7, 21, 8, tzinfo=UTC),
            provider=FakeRoutingProvider(),
        )

        self.assertEqual(result["route"]["type"], "LineString")
        self.assertGreaterEqual(len(result["route"]["coordinates"]), 2)
        self.assertTrue(
            all(
                len(coordinate) == 2
                and -180 <= coordinate[0] <= 180
                and -90 <= coordinate[1] <= 90
                for coordinate in result["route"]["coordinates"]
            )
        )
        self.assertTrue(
            all(
                stop["coordinate"] is not None
                and -180 <= stop["coordinate"][0] <= 180
                and -90 <= stop["coordinate"][1] <= 90
                for stop in result["stops"]
            )
        )

    @patch(
        "httpx.Client.request",
        side_effect=AssertionError("Network access is not allowed in tests"),
    )
    def test_fake_provider_calculation_performs_no_network_calls(
        self,
        request_mock,
    ) -> None:
        calculate_trip(
            current_location="Current",
            pickup_location="Pickup",
            dropoff_location="Drop-off",
            current_cycle_used_hours=20,
            start_time=datetime(2026, 7, 21, 8, tzinfo=UTC),
            provider=FakeRoutingProvider(),
        )

        request_mock.assert_not_called()

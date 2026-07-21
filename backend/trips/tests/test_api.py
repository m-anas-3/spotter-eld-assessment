from unittest.mock import patch

from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from trips.services.openrouteservice import RoutingProviderError


class TripApiTests(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.health_url = reverse("trips:health")
        self.calculate_url = reverse("trips:calculate")
        self.valid_payload = {
            "current_location": "Chicago, IL",
            "pickup_location": "Milwaukee, WI",
            "dropoff_location": "Dallas, TX",
            "current_cycle_used_hours": 20,
        }
        self.trip_response = {
            "trip_summary": {
                "total_distance_miles": 100,
                "estimated_driving_hours": 2,
                "total_trip_hours": 4,
                "total_trip_days": 1,
                "fuel_stop_count": 0,
                "initial_cycle_used_hours": 20,
                "final_cycle_used_hours": 24,
            },
            "locations": {},
            "route": {
                "type": "LineString",
                "coordinates": [[-87.0, 41.0], [-88.0, 42.0]],
                "legs": [],
            },
            "route_legs": [],
            "stops": [],
            "timeline": [],
            "daily_logs": [{"date": "2026-07-21", "events": []}],
            "assumptions": [],
        }
        service_patcher = patch(
            "trips.views.calculate_trip_service",
            return_value=self.trip_response,
        )
        self.calculate_service = service_patcher.start()
        self.addCleanup(service_patcher.stop)

    def test_health_endpoint_returns_http_200(self) -> None:
        response = self.client.get(self.health_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_health_response_contains_ok_status(self) -> None:
        response = self.client.get(self.health_url)

        self.assertEqual(response.json()["status"], "ok")

    def test_calculate_endpoint_accepts_valid_input(self) -> None:
        response = self.client.post(
            self.calculate_url,
            self.valid_payload,
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_calculate_response_supports_gzip_compression(self) -> None:
        response = self.client.post(
            self.calculate_url,
            self.valid_payload,
            format="json",
            HTTP_ACCEPT_ENCODING="gzip",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.headers.get("Content-Encoding"), "gzip")

    def test_empty_current_location_is_rejected(self) -> None:
        payload = {**self.valid_payload, "current_location": "   "}

        response = self.client.post(self.calculate_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_location", response.json())

    def test_empty_pickup_location_is_rejected(self) -> None:
        payload = {**self.valid_payload, "pickup_location": ""}

        response = self.client.post(self.calculate_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pickup_location", response.json())

    def test_empty_dropoff_location_is_rejected(self) -> None:
        payload = {**self.valid_payload, "dropoff_location": "  "}

        response = self.client.post(self.calculate_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("dropoff_location", response.json())

    def test_cycle_hours_below_zero_are_rejected(self) -> None:
        payload = {**self.valid_payload, "current_cycle_used_hours": -0.1}

        response = self.client.post(self.calculate_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_cycle_used_hours", response.json())

    def test_cycle_hours_above_seventy_are_rejected(self) -> None:
        payload = {**self.valid_payload, "current_cycle_used_hours": 70.1}

        response = self.client.post(self.calculate_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("current_cycle_used_hours", response.json())

    def test_valid_optional_start_time_is_accepted(self) -> None:
        payload = {
            **self.valid_payload,
            "start_time": "2026-07-21T08:00:00Z",
        }

        response = self.client.post(self.calculate_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_invalid_start_time_is_rejected(self) -> None:
        payload = {
            **self.valid_payload,
            "start_time": "2026-07-21T08:00:00",
        }

        response = self.client.post(self.calculate_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("start_time", response.json())

    def test_successful_response_has_required_top_level_fields(self) -> None:
        response = self.client.post(
            self.calculate_url,
            self.valid_payload,
            format="json",
        )

        self.assertEqual(
            set(response.json()),
            {
                "trip_summary",
                "locations",
                "route",
                "route_legs",
                "stops",
                "timeline",
                "daily_logs",
                "assumptions",
            },
        )

    def test_route_is_a_geojson_linestring(self) -> None:
        response = self.client.post(
            self.calculate_url,
            self.valid_payload,
            format="json",
        )

        route = response.json()["route"]
        self.assertEqual(route["type"], "LineString")
        self.assertIsInstance(route["coordinates"], list)

    def test_complete_response_has_nonempty_daily_logs(self) -> None:
        response = self.client.post(
            self.calculate_url,
            self.valid_payload,
            format="json",
        )

        self.assertTrue(response.json()["daily_logs"])

    def test_routing_failure_uses_sanitized_error_shape(self) -> None:
        self.calculate_service.side_effect = RoutingProviderError()

        response = self.client.post(
            self.calculate_url,
            self.valid_payload,
            format="json",
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_503_SERVICE_UNAVAILABLE,
        )
        self.assertEqual(
            response.json(),
            {
                "error": {
                    "code": "ROUTING_PROVIDER_ERROR",
                    "message": "Unable to calculate the route right now.",
                    "details": {},
                }
            },
        )

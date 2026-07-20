from datetime import UTC, datetime

from django.test import SimpleTestCase

from trips.constants import DutyStatus, EventType
from trips.services.routing import RouteLeg, RouteResult
from trips.services.scheduling import HOSScheduler


START_TIME = datetime(2026, 7, 21, 8, 0, tzinfo=UTC)


def make_route(
    *,
    first_minutes: int = 120,
    second_minutes: int = 180,
    first_miles: float = 100,
    second_miles: float = 150,
) -> RouteResult:
    first = RouteLeg(
        start_label="Current",
        end_label="Pickup",
        distance_miles=first_miles,
        duration_minutes=first_minutes,
        geometry=[[-90.0, 40.0], [-89.0, 41.0]],
    )
    second = RouteLeg(
        start_label="Pickup",
        end_label="Drop-off",
        distance_miles=second_miles,
        duration_minutes=second_minutes,
        geometry=[[-89.0, 41.0], [-88.0, 42.0]],
    )
    return RouteResult(
        legs=[first, second],
        distance_miles=first_miles + second_miles,
        duration_minutes=first_minutes + second_minutes,
        geometry=[[-90.0, 40.0], [-89.0, 41.0], [-88.0, 42.0]],
    )


def schedule_route(
    route: RouteResult,
    *,
    cycle_hours: float = 0,
):
    return HOSScheduler(
        route,
        start_time=START_TIME,
        initial_cycle_used_minutes=round(cycle_hours * 60),
    ).schedule()


def event_types(result) -> list[str]:
    return [event["type"] for event in result.timeline]


class HOSSchedulerTests(SimpleTestCase):
    def test_short_trip_creates_driving_pickup_and_dropoff(self) -> None:
        result = schedule_route(make_route())

        types = event_types(result)
        self.assertIn(EventType.DRIVING.value, types)
        self.assertIn(EventType.PICKUP.value, types)
        self.assertIn(EventType.DROPOFF.value, types)

    def test_trip_below_eight_hours_has_no_unnecessary_break(self) -> None:
        result = schedule_route(
            make_route(first_minutes=180, second_minutes=240)
        )

        self.assertNotIn(EventType.REQUIRED_BREAK.value, event_types(result))

    def test_trip_over_eight_hours_adds_required_break(self) -> None:
        result = schedule_route(
            make_route(first_minutes=540, second_minutes=60)
        )

        breaks = [
            event
            for event in result.timeline
            if event["type"] == EventType.REQUIRED_BREAK.value
        ]
        self.assertEqual(len(breaks), 1)
        self.assertEqual(breaks[0]["duration_minutes"], 30)

    def test_pickup_or_fueling_can_satisfy_break_requirement(self) -> None:
        pickup_result = schedule_route(
            make_route(first_minutes=480, second_minutes=60)
        )
        fuel_result = schedule_route(
            make_route(
                first_minutes=10,
                second_minutes=590,
                first_miles=100,
                second_miles=1_900,
            )
        )

        self.assertNotIn(
            EventType.REQUIRED_BREAK.value,
            event_types(pickup_result),
        )
        self.assertIn(EventType.FUEL.value, event_types(fuel_result))
        self.assertNotIn(
            EventType.REQUIRED_BREAK.value,
            event_types(fuel_result),
        )

    def test_trip_over_eleven_hours_adds_sleeper_rest(self) -> None:
        result = schedule_route(
            make_route(first_minutes=720, second_minutes=60)
        )

        rests = [
            event
            for event in result.timeline
            if event["type"] == EventType.DAILY_REST.value
        ]
        self.assertGreaterEqual(len(rests), 1)
        self.assertEqual(rests[0]["duration_minutes"], 600)
        self.assertEqual(
            rests[0]["status"],
            DutyStatus.SLEEPER_BERTH.value,
        )

    def test_driving_respects_fourteen_hour_window(self) -> None:
        result = schedule_route(
            make_route(
                first_minutes=60,
                second_minutes=600,
                first_miles=100,
                second_miles=8_900,
            )
        )

        first_rest = next(
            event
            for event in result.timeline
            if event["type"] == EventType.DAILY_REST.value
        )
        rest_start = datetime.fromisoformat(
            first_rest["start_time"].replace("Z", "+00:00")
        )
        self.assertEqual(
            int((rest_start - START_TIME).total_seconds() // 60),
            14 * 60,
        )

    def test_on_duty_activity_counts_toward_work_window(self) -> None:
        result = schedule_route(
            make_route(
                first_minutes=60,
                second_minutes=600,
                first_miles=100,
                second_miles=8_900,
            )
        )

        first_rest_index = next(
            index
            for index, event in enumerate(result.timeline)
            if event["type"] == EventType.DAILY_REST.value
        )
        before_rest = result.timeline[:first_rest_index]
        driving_minutes = sum(
            event["duration_minutes"]
            for event in before_rest
            if event["status"] == DutyStatus.DRIVING.value
        )
        on_duty_minutes = sum(
            event["duration_minutes"]
            for event in before_rest
            if event["status"] == DutyStatus.ON_DUTY_NOT_DRIVING.value
        )
        self.assertLess(driving_minutes, 11 * 60)
        self.assertEqual(driving_minutes + on_duty_minutes, 14 * 60)

    def test_trip_over_one_thousand_miles_creates_one_fuel_stop(self) -> None:
        result = schedule_route(
            make_route(first_miles=500, second_miles=700)
        )

        fuel_stops = [
            stop for stop in result.stops if stop["type"] == EventType.FUEL.value
        ]
        self.assertEqual(len(fuel_stops), 1)

    def test_trip_over_two_thousand_miles_creates_multiple_fuel_stops(self) -> None:
        result = schedule_route(
            make_route(first_miles=900, second_miles=1_300)
        )

        fuel_stops = [
            stop for stop in result.stops if stop["type"] == EventType.FUEL.value
        ]
        self.assertEqual(len(fuel_stops), 2)
        self.assertNotEqual(
            fuel_stops[0]["coordinate"],
            fuel_stops[1]["coordinate"],
        )

    def test_driving_time_increases_cycle_used_hours(self) -> None:
        result = schedule_route(
            make_route(first_minutes=60, second_minutes=60)
        )
        driving_minutes = sum(
            event["duration_minutes"]
            for event in result.timeline
            if event["status"] == DutyStatus.DRIVING.value
        )

        self.assertEqual(driving_minutes, 120)
        self.assertGreater(result.final_cycle_used_minutes, driving_minutes)

    def test_on_duty_activities_increase_cycle_used_hours(self) -> None:
        result = schedule_route(
            make_route(
                first_minutes=60,
                second_minutes=60,
                first_miles=500,
                second_miles=700,
            )
        )
        counted_minutes = sum(
            event["duration_minutes"]
            for event in result.timeline
            if event["status"]
            in {
                DutyStatus.DRIVING.value,
                DutyStatus.ON_DUTY_NOT_DRIVING.value,
            }
        )

        self.assertEqual(result.final_cycle_used_minutes, counted_minutes)
        self.assertEqual(
            sum(
                event["duration_minutes"]
                for event in result.timeline
                if event["type"]
                in {
                    EventType.PICKUP.value,
                    EventType.DROPOFF.value,
                    EventType.FUEL.value,
                }
            ),
            150,
        )

    def test_sleeper_and_off_duty_do_not_increase_cycle_used(self) -> None:
        result = schedule_route(
            make_route(first_minutes=720, second_minutes=60)
        )
        counted_minutes = sum(
            event["duration_minutes"]
            for event in result.timeline
            if event["status"]
            in {
                DutyStatus.DRIVING.value,
                DutyStatus.ON_DUTY_NOT_DRIVING.value,
            }
        )

        self.assertTrue(
            any(
                event["status"]
                in {
                    DutyStatus.SLEEPER_BERTH.value,
                    DutyStatus.OFF_DUTY.value,
                }
                for event in result.timeline
            )
        )
        self.assertEqual(result.final_cycle_used_minutes, counted_minutes)

    def test_near_cycle_limit_creates_thirty_four_hour_restart(self) -> None:
        result = schedule_route(
            make_route(first_minutes=120, second_minutes=60),
            cycle_hours=69,
        )

        restarts = [
            event
            for event in result.timeline
            if event["type"] == EventType.CYCLE_RESTART.value
        ]
        self.assertEqual(len(restarts), 1)
        self.assertEqual(restarts[0]["duration_minutes"], 34 * 60)
        self.assertEqual(restarts[0]["status"], DutyStatus.OFF_DUTY.value)

    def test_all_timeline_events_have_positive_duration(self) -> None:
        result = schedule_route(
            make_route(first_minutes=720, second_minutes=600, second_miles=2_100)
        )

        self.assertTrue(
            all(event["duration_minutes"] > 0 for event in result.timeline)
        )

    def test_timeline_events_do_not_overlap(self) -> None:
        result = schedule_route(
            make_route(first_minutes=720, second_minutes=600, second_miles=2_100)
        )

        for previous, current in zip(result.timeline, result.timeline[1:]):
            previous_end = datetime.fromisoformat(
                previous["end_time"].replace("Z", "+00:00")
            )
            current_start = datetime.fromisoformat(
                current["start_time"].replace("Z", "+00:00")
            )
            self.assertLessEqual(previous_end, current_start)

    def test_timeline_events_are_chronological(self) -> None:
        result = schedule_route(
            make_route(first_minutes=720, second_minutes=600, second_miles=2_100)
        )

        starts = [
            datetime.fromisoformat(
                event["start_time"].replace("Z", "+00:00")
            )
            for event in result.timeline
        ]
        self.assertEqual(starts, sorted(starts))

from datetime import UTC, datetime, timedelta

from django.test import SimpleTestCase

from trips.constants import DutyStatus, EventType
from trips.services.eld import TimelineValidationError, generate_daily_logs
from trips.services.scheduling import format_datetime


def make_event(
    event_type: str,
    status: str,
    start: datetime,
    end: datetime,
    *,
    location: str | None = "Test location",
    description: str | None = "Test event",
    distance_miles: float | None = None,
) -> dict[str, object]:
    return {
        "type": event_type,
        "status": status,
        "start_time": format_datetime(start),
        "end_time": format_datetime(end),
        "duration_minutes": int((end - start).total_seconds() // 60),
        "duration_hours": round((end - start).total_seconds() / 3_600, 2),
        "location": location,
        "coordinate": [-90.0, 40.0],
        "distance_miles": distance_miles,
        "description": description,
    }


def generate_for_single_event(
    event_type: str,
    status: str,
    start: datetime,
    end: datetime,
):
    event = make_event(event_type, status, start, end)
    return generate_daily_logs([event], start, end)


class DailyEldLogTests(SimpleTestCase):
    def test_daily_log_contains_projected_record_metadata(self) -> None:
        start = datetime(2026, 7, 21, 8, tzinfo=UTC)
        logs = generate_for_single_event(
            EventType.DRIVING.value,
            DutyStatus.DRIVING.value,
            start,
            start + timedelta(hours=1),
        )

        metadata = logs[0]["log_metadata"]
        self.assertEqual(metadata["record_type"], "PROJECTED")
        self.assertEqual(metadata["time_zone"], "UTC")
        self.assertEqual(metadata["period_start"], "00:00")
        self.assertIsNone(metadata["driver_name"])
        self.assertIsNone(metadata["co_driver_name"])
        self.assertEqual(metadata["certification_status"], "NOT_CERTIFIED")

    def test_driving_distance_is_split_across_midnight(self) -> None:
        start = datetime(2026, 7, 21, 22, tzinfo=UTC)
        end = datetime(2026, 7, 22, 2, tzinfo=UTC)
        event = make_event(
            EventType.DRIVING.value,
            DutyStatus.DRIVING.value,
            start,
            end,
            distance_miles=200,
        )

        logs = generate_daily_logs([event], start, end)

        self.assertEqual(
            [log["total_driving_miles"] for log in logs],
            [100.0, 100.0],
        )

    def test_event_within_one_day_is_not_split(self) -> None:
        start = datetime(2026, 7, 21, 8, tzinfo=UTC)
        end = start + timedelta(hours=4)

        logs = generate_for_single_event(
            EventType.DRIVING.value,
            DutyStatus.DRIVING.value,
            start,
            end,
        )

        driving = [
            event
            for event in logs[0]["events"]
            if event["type"] == EventType.DRIVING.value
        ]
        self.assertEqual(len(driving), 1)
        self.assertEqual(driving[0]["duration_minutes"], 240)

    def test_driving_event_crossing_midnight_is_split(self) -> None:
        start = datetime(2026, 7, 21, 22, tzinfo=UTC)
        end = datetime(2026, 7, 22, 4, tzinfo=UTC)

        logs = generate_for_single_event(
            EventType.DRIVING.value,
            DutyStatus.DRIVING.value,
            start,
            end,
        )

        pieces = [
            event
            for log in logs
            for event in log["events"]
            if event["type"] == EventType.DRIVING.value
        ]
        self.assertEqual(
            [piece["duration_minutes"] for piece in pieces],
            [120, 240],
        )
        self.assertEqual(pieces[0]["end_time"], "24:00")
        self.assertEqual(pieces[1]["start_time"], "00:00")

    def test_sleeper_event_crossing_midnight_is_split(self) -> None:
        start = datetime(2026, 7, 21, 20, tzinfo=UTC)
        end = datetime(2026, 7, 22, 6, tzinfo=UTC)

        logs = generate_for_single_event(
            EventType.DAILY_REST.value,
            DutyStatus.SLEEPER_BERTH.value,
            start,
            end,
        )

        pieces = [
            event
            for log in logs
            for event in log["events"]
            if event["type"] == EventType.DAILY_REST.value
        ]
        self.assertEqual(
            [piece["duration_minutes"] for piece in pieces],
            [240, 360],
        )
        self.assertTrue(
            all(
                piece["status"] == DutyStatus.SLEEPER_BERTH.value
                for piece in pieces
            )
        )

    def test_cycle_restart_across_multiple_days_has_daily_pieces(self) -> None:
        start = datetime(2026, 7, 21, 22, tzinfo=UTC)
        end = start + timedelta(hours=34)

        logs = generate_for_single_event(
            EventType.CYCLE_RESTART.value,
            DutyStatus.OFF_DUTY.value,
            start,
            end,
        )

        pieces = [
            event
            for log in logs
            for event in log["events"]
            if event["type"] == EventType.CYCLE_RESTART.value
        ]
        self.assertEqual(len(logs), 3)
        self.assertEqual(
            [piece["duration_minutes"] for piece in pieces],
            [120, 1_440, 480],
        )

    def test_first_day_is_filled_before_trip_start(self) -> None:
        start = datetime(2026, 7, 21, 8, tzinfo=UTC)
        end = start + timedelta(hours=2)

        logs = generate_for_single_event(
            EventType.DRIVING.value,
            DutyStatus.DRIVING.value,
            start,
            end,
        )

        fill = logs[0]["events"][0]
        self.assertEqual(fill["type"], "OFF_DUTY_FILL")
        self.assertEqual(fill["start_minute"], 0)
        self.assertEqual(fill["end_minute"], 480)

    def test_final_day_is_filled_after_trip_completion(self) -> None:
        start = datetime(2026, 7, 21, 8, tzinfo=UTC)
        end = start + timedelta(hours=2)

        logs = generate_for_single_event(
            EventType.DRIVING.value,
            DutyStatus.DRIVING.value,
            start,
            end,
        )

        fill = logs[-1]["events"][-1]
        self.assertEqual(fill["type"], "OFF_DUTY_FILL")
        self.assertEqual(fill["start_minute"], 600)
        self.assertEqual(fill["end_minute"], 1_440)

    def test_every_daily_log_totals_1440_minutes(self) -> None:
        logs = self._multiday_logs()

        self.assertTrue(
            all(
                log["status_totals"]["total_minutes"] == 1_440
                for log in logs
            )
        )

    def test_every_daily_log_totals_24_hours(self) -> None:
        logs = self._multiday_logs()

        self.assertTrue(
            all(log["status_totals"]["total_hours"] == 24 for log in logs)
        )

    def test_status_totals_match_corresponding_events(self) -> None:
        logs = self._mapped_status_logs()
        key_by_status = {
            DutyStatus.OFF_DUTY.value: "off_duty_minutes",
            DutyStatus.SLEEPER_BERTH.value: "sleeper_berth_minutes",
            DutyStatus.DRIVING.value: "driving_minutes",
            DutyStatus.ON_DUTY_NOT_DRIVING.value:
                "on_duty_not_driving_minutes",
        }

        for log in logs:
            for status, key in key_by_status.items():
                event_total = sum(
                    event["duration_minutes"]
                    for event in log["events"]
                    if event["status"] == status
                )
                self.assertEqual(log["status_totals"][key], event_total)

    def test_combined_on_duty_total_includes_driving_and_work(self) -> None:
        for log in self._mapped_status_logs():
            totals = log["status_totals"]
            expected = (
                totals["driving_minutes"]
                + totals["on_duty_not_driving_minutes"]
            )
            self.assertEqual(totals["total_on_duty_minutes"], expected)
            self.assertEqual(
                totals["total_on_duty_hours"],
                round(expected / 60, 2),
            )

    def test_daily_events_are_ordered_by_start_minute(self) -> None:
        for log in self._multiday_logs():
            starts = [event["start_minute"] for event in log["events"]]
            self.assertEqual(starts, sorted(starts))

    def test_daily_events_do_not_overlap(self) -> None:
        for log in self._multiday_logs():
            for previous, current in zip(
                log["events"],
                log["events"][1:],
            ):
                self.assertLessEqual(
                    previous["end_minute"],
                    current["start_minute"],
                )

    def test_daily_events_cover_zero_through_1440(self) -> None:
        for log in self._multiday_logs():
            self.assertEqual(log["events"][0]["start_minute"], 0)
            self.assertEqual(log["events"][-1]["end_minute"], 1_440)
            for previous, current in zip(
                log["events"],
                log["events"][1:],
            ):
                self.assertEqual(
                    previous["end_minute"],
                    current["start_minute"],
                )

    def test_daily_minute_values_are_valid(self) -> None:
        for log in self._multiday_logs():
            for event in log["events"]:
                self.assertGreaterEqual(event["start_minute"], 0)
                self.assertLess(event["start_minute"], 1_440)
                self.assertGreater(event["end_minute"], 0)
                self.assertLessEqual(event["end_minute"], 1_440)
                self.assertLess(
                    event["start_minute"],
                    event["end_minute"],
                )

    def test_multiday_trip_generates_multiple_logs(self) -> None:
        self.assertEqual(len(self._multiday_logs()), 3)

    def test_daily_sleeper_rest_uses_sleeper_berth_row(self) -> None:
        events = self._events_by_type(EventType.DAILY_REST.value)
        self.assertTrue(events)
        self.assertTrue(
            all(
                event["status"] == DutyStatus.SLEEPER_BERTH.value
                for event in events
            )
        )

    def test_cycle_restart_uses_off_duty_row(self) -> None:
        events = self._events_by_type(EventType.CYCLE_RESTART.value)
        self.assertTrue(events)
        self.assertTrue(
            all(
                event["status"] == DutyStatus.OFF_DUTY.value
                for event in events
            )
        )

    def test_pickup_uses_on_duty_not_driving_row(self) -> None:
        self._assert_event_status(
            EventType.PICKUP,
            DutyStatus.ON_DUTY_NOT_DRIVING,
        )

    def test_dropoff_uses_on_duty_not_driving_row(self) -> None:
        self._assert_event_status(
            EventType.DROPOFF,
            DutyStatus.ON_DUTY_NOT_DRIVING,
        )

    def test_fueling_uses_on_duty_not_driving_row(self) -> None:
        self._assert_event_status(
            EventType.FUEL,
            DutyStatus.ON_DUTY_NOT_DRIVING,
        )

    def test_required_break_uses_off_duty_row(self) -> None:
        self._assert_event_status(
            EventType.REQUIRED_BREAK,
            DutyStatus.OFF_DUTY,
        )

    def test_timeline_gap_is_rejected(self) -> None:
        start = datetime(2026, 7, 21, 8, tzinfo=UTC)
        first_end = start + timedelta(hours=1)
        second_start = first_end + timedelta(minutes=1)
        completion = second_start + timedelta(hours=1)
        timeline = [
            make_event(
                EventType.DRIVING.value,
                DutyStatus.DRIVING.value,
                start,
                first_end,
            ),
            make_event(
                EventType.DRIVING.value,
                DutyStatus.DRIVING.value,
                second_start,
                completion,
            ),
        ]

        with self.assertRaises(TimelineValidationError):
            generate_daily_logs(timeline, start, completion)

    def _multiday_logs(self):
        start = datetime(2026, 7, 21, 22, tzinfo=UTC)
        end = datetime(2026, 7, 23, 2, tzinfo=UTC)
        return generate_for_single_event(
            EventType.CYCLE_RESTART.value,
            DutyStatus.OFF_DUTY.value,
            start,
            end,
        )

    def _mapped_status_logs(self):
        start = datetime(2026, 7, 21, 8, tzinfo=UTC)
        definitions = [
            (EventType.DRIVING, DutyStatus.DRIVING, 60),
            (EventType.PICKUP, DutyStatus.ON_DUTY_NOT_DRIVING, 60),
            (EventType.FUEL, DutyStatus.ON_DUTY_NOT_DRIVING, 30),
            (EventType.REQUIRED_BREAK, DutyStatus.OFF_DUTY, 30),
            (EventType.DAILY_REST, DutyStatus.SLEEPER_BERTH, 600),
            (EventType.CYCLE_RESTART, DutyStatus.OFF_DUTY, 2_040),
            (EventType.DROPOFF, DutyStatus.ON_DUTY_NOT_DRIVING, 60),
        ]
        timeline = []
        cursor = start
        for event_type, status, duration in definitions:
            end = cursor + timedelta(minutes=duration)
            timeline.append(
                make_event(event_type.value, status.value, cursor, end)
            )
            cursor = end
        return generate_daily_logs(timeline, start, cursor)

    def _events_by_type(self, event_type: str):
        return [
            event
            for log in self._mapped_status_logs()
            for event in log["events"]
            if event["type"] == event_type
        ]

    def _assert_event_status(
        self,
        event_type: EventType,
        status: DutyStatus,
    ) -> None:
        events = self._events_by_type(event_type.value)
        self.assertTrue(events)
        self.assertTrue(
            all(event["status"] == status.value for event in events)
        )
